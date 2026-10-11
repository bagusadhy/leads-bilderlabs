(function(){
  'use strict';
  var form=document.getElementById('login'),err=document.getElementById('err'),btn=document.getElementById('submit');
  fetch('/api/me',{credentials:'same-origin'}).then(function(r){if(r.ok)location.replace('/')}).catch(function(){});
  form.addEventListener('submit',function(e){
    e.preventDefault();err.textContent='';
    var u=form.username.value.trim(),p=form.password.value;
    if(!u||!p){err.textContent='Isi username dan password.';return}
    btn.disabled=true;btn.textContent='Masuk…';
    fetch('/api/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'bilder'},body:JSON.stringify({username:u,password:p})})
      .then(function(r){return r.json().catch(function(){return{}}).then(function(j){return{ok:r.ok,j:j}})})
      .then(function(res){if(res.ok){location.replace('/');return}err.textContent=res.j.error||'Gagal masuk.';btn.disabled=false;btn.textContent='Masuk'})
      .catch(function(){err.textContent='Tidak bisa terhubung ke server.';btn.disabled=false;btn.textContent='Masuk'});
  });
})();
