import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";
import { paymentConfig } from "./payment-config.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app), storage = getStorage(app);
const grid = document.getElementById("downloadsGrid"), empty = document.getElementById("downloadsEmpty");
const modal = document.getElementById("checkoutModal");
const $ = id => document.getElementById(id);
let selectedItem = null, selectedMethod = "bank", appliedPromo = null, calculatedTotal = 0;
const esc = v => String(v ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const money = n => new Intl.NumberFormat("en-LK",{style:"currency",currency:"LKR",maximumFractionDigits:0}).format(Number(n)||0);
const basePrice = item => Math.max(0, Number(item.salePrice || item.price || 0));

function cardHTML(item){
  const paid=item.accessType==="paid" && Number(item.price)>0, price=basePrice(item), hasSale=paid && item.salePrice && Number(item.salePrice)<Number(item.price);
  return `<div class="download-cover"><img src="${esc(item.imageURL||"profile.png")}" alt="${esc(item.title)}" loading="lazy"><span class="download-type"><i class="fa-solid ${paid?'fa-lock':'fa-file-arrow-down'}"></i> ${paid?'PREMIUM':'FREE'}</span>${hasSale?'<span class="sale-badge">SALE</span>':''}</div><div class="download-content"><h3>${esc(item.title)}</h3><p>${esc(item.description||"Premium resource from EDITZ LK.")}</p><div class="product-price">${paid?(hasSale?`<del>${money(item.price)}</del><strong>${money(price)}</strong>`:`<strong>${money(price)}</strong>`):'<strong>FREE</strong>'}</div><button class="download-action" data-buy="${item.id}"><span>${paid?'Buy & Download':'Download Free'}</span><i class="fa-solid ${paid?'fa-cart-shopping':'fa-download'}"></i></button></div>`;
}

onSnapshot(query(collection(db,"downloads"),where("published","==",true)), snap=>{
  grid.innerHTML=""; const items=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
  empty.hidden=items.length>0;
  items.forEach(item=>{const card=document.createElement("article");card.className="download-card reveal-item";card.innerHTML=cardHTML(item);grid.appendChild(card);card.querySelector("[data-buy]").onclick=()=>item.accessType==="paid"?openCheckout(item):window.open(item.link,"_blank","noopener");});
},err=>{console.error(err);empty.hidden=false;empty.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i><p>Downloads are temporarily unavailable.</p>';});

function updateTotal(){
  if(!selectedItem)return; const original=basePrice(selectedItem); let discount=0;
  if(appliedPromo){discount=appliedPromo.type==="percent"?original*(Number(appliedPromo.value)/100):Number(appliedPromo.value);discount=Math.min(original,discount);}
  calculatedTotal=Math.max(0,Math.round(original-discount));
  $("checkoutPriceBox").innerHTML=`<div><span>Item price</span><strong>${money(original)}</strong></div>${discount?`<div class="discount-row"><span>Promo discount</span><strong>− ${money(discount)}</strong></div>`:""}<div class="checkout-total"><span>Total</span><strong>${money(calculatedTotal)}</strong></div>`;
}
function openCheckout(item){selectedItem=item;appliedPromo=null;$("checkoutPromo").value="";$("promoFeedback").textContent="";$("checkoutStatus").innerHTML="";$("checkoutTitle").textContent=item.title;$("checkoutDescription").textContent=item.description||"Complete payment to unlock your download.";updateTotal();modal.showModal();}
$("closeCheckout").onclick=()=>modal.close();
document.querySelectorAll(".payment-method").forEach(btn=>btn.onclick=()=>{selectedMethod=btn.dataset.method;document.querySelectorAll(".payment-method").forEach(x=>x.classList.toggle("active",x===btn));$("bankPaymentPanel").classList.toggle("active",selectedMethod==="bank");$("cardPaymentPanel").classList.toggle("active",selectedMethod==="card");});
$("bankAccountDetails").innerHTML=`<b>Bank Name: ${esc(paymentConfig.bankName)}</b><br>Account Name: ${esc(paymentConfig.accountName)}<br>Account No: ${esc(paymentConfig.accountNumber)}${paymentConfig.branch ? `<br>Branch: ${esc(paymentConfig.branch)}` : ""}`;
$("bankReceipt").onchange=e=>$("receiptName").textContent=e.target.files[0]?.name||"JPG, PNG or PDF";
function buyer(){return {name:$("buyerName").value.trim(),email:$("buyerEmail").value.trim().toLowerCase(),phone:$("buyerPhone").value.trim()};}
function validateBuyer(){const b=buyer();if(!b.name||!/^\S+@\S+\.\S+$/.test(b.email)||b.phone.length<7)throw new Error("Please enter a valid name, email and phone number.");return b;}

$("applyPromo").onclick=async()=>{const code=$("checkoutPromo").value.trim().toUpperCase();appliedPromo=null;if(!code){$("promoFeedback").textContent="Enter a promo code.";updateTotal();return;}$("promoFeedback").textContent="Checking code…";try{const snap=await getDocs(query(collection(db,"promoCodes"),where("code","==",code),where("active","==",true)));if(snap.empty)throw new Error("Invalid or inactive promo code.");const promo={id:snap.docs[0].id,...snap.docs[0].data()};if(promo.expiresAt?.toDate?.()<new Date())throw new Error("This promo code has expired.");if(Number(promo.usageLimit)>0 && Number(promo.usedCount||0)>=Number(promo.usageLimit))throw new Error("This promo code has reached its usage limit.");if(basePrice(selectedItem)<Number(promo.minimum||0))throw new Error(`Minimum order is ${money(promo.minimum)}.`);appliedPromo=promo;$("promoFeedback").textContent=`Promo ${code} applied successfully.`;updateTotal();}catch(e){$("promoFeedback").textContent=e.message;updateTotal();}};

function setCheckoutLoading(active, title="PROCESSING ORDER", text="Securing your payment proof...", percent=0){
  const loader=$("checkoutLoader"), bar=$("checkoutLoaderBar"), percentEl=$("checkoutLoaderPercent");
  if(!loader)return;
  loader.classList.toggle("active",active);
  loader.setAttribute("aria-hidden",active?"false":"true");
  document.body.classList.toggle("checkout-busy",active);
  $("checkoutLoaderTitle").textContent=title;
  $("checkoutLoaderText").textContent=text;
  bar.style.width=`${Math.max(0,Math.min(100,percent))}%`;
  percentEl.textContent=`${Math.round(percent)}%`;
}
function updateCheckoutLoading(title,text,percent){setCheckoutLoading(true,title,text,percent);}

function uploadReceipt(file, orderKey){return new Promise((resolve,reject)=>{const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const path=`payment_receipts/${orderKey}/${Date.now()}_${safeName}`;const task=uploadBytesResumable(ref(storage,path),file,{contentType:file.type||"application/octet-stream"});task.on("state_changed",s=>{const pct=Math.round(s.bytesTransferred/s.totalBytes*100);updateCheckoutLoading("UPLOADING RECEIPT",`Encrypted upload in progress — ${pct}%`,Math.min(82,pct*.82));},reject,()=>resolve({receiptPath:path,receiptName:file.name,receiptType:file.type||"application/octet-stream"}));});}

$("submitBankOrder").onclick=async()=>{
  const btn=$("submitBankOrder");
  if(btn.disabled)return;
  try{
    const b=validateBuyer(),file=$("bankReceipt").files[0];
    if(!file)throw new Error("Please upload your bank payment receipt.");
    if(file.size>15*1024*1024)throw new Error("Receipt must be smaller than 15 MB.");
    btn.disabled=true;
    $("closeCheckout").disabled=true;
    $("checkoutStatus").innerHTML="";
    setCheckoutLoading(true,"INITIALIZING ORDER","Generating a secure order reference...",6);
    const orderKey=`BANK-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    await new Promise(resolve=>setTimeout(resolve,320));
    const receipt=await uploadReceipt(file,orderKey);
    updateCheckoutLoading("SAVING ORDER","Verifying details and registering your order...",90);
    await addDoc(collection(db,"orders"),{orderId:orderKey,itemId:selectedItem.id,itemTitle:selectedItem.title,buyerName:b.name,buyerEmail:b.email,buyerPhone:b.phone,method:"bank",status:"pending",currency:"LKR",originalAmount:basePrice(selectedItem),amount:calculatedTotal,promoCode:appliedPromo?.code||"",promoId:appliedPromo?.id||"",...receipt,createdAt:serverTimestamp()});
    updateCheckoutLoading("ORDER LOCKED IN","Payment proof submitted successfully.",100);
    await new Promise(resolve=>setTimeout(resolve,650));
    setCheckoutLoading(false);
    $("checkoutStatus").innerHTML=`<div class="checkout-success"><i class="fa-solid fa-circle-check"></i><h3>Payment proof submitted</h3><p>Order <b>${orderKey}</b> is waiting for admin approval. After approval, the download link will be sent directly to <b>${esc(b.email)}</b>.</p><a class="download-action" href="order-status.html?order_id=${encodeURIComponent(orderKey)}&email=${encodeURIComponent(b.email)}">View Order Details</a></div>`;
  }catch(e){
    setCheckoutLoading(false);
    $("checkoutStatus").innerHTML=`<p class="checkout-error"><i class="fa-solid fa-circle-exclamation"></i> ${esc(e.message)}</p>`;
  }finally{
    btn.disabled=false;
    $("closeCheckout").disabled=false;
  }
};

$("startCardPayment").onclick=async()=>{try{const b=validateBuyer();if(!paymentConfig.functionsBaseURL)throw new Error("Card payments are not configured yet. Add the deployed Firebase Functions URL in payment-config.js.");const btn=$("startCardPayment");btn.disabled=true;$("checkoutStatus").textContent="Creating secure payment…";const res=await fetch(`${paymentConfig.functionsBaseURL}/createPayHerePayment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId:selectedItem.id,buyer:b,promoCode:appliedPromo?.code||""})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not start card payment.");const form=document.createElement("form");form.method="POST";form.action=data.action;Object.entries(data.fields).forEach(([k,v])=>{const i=document.createElement("input");i.type="hidden";i.name=k;i.value=v;form.appendChild(i)});document.body.appendChild(form);form.submit();}catch(e){$("checkoutStatus").innerHTML=`<p class="checkout-error"><i class="fa-solid fa-circle-exclamation"></i> ${esc(e.message)}</p>`;$("startCardPayment").disabled=false;}};
