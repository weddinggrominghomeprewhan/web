
// Mobile Menu Toggle
/* const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links'); */

/* menuToggle.addEventListener('click', () => {
	navLinks.classList.toggle('active');
}); */

// Close menu when clicking a link
/* document.querySelectorAll('.nav-links a').forEach(link => {
	link.addEventListener('click', () => {
		navLinks.classList.remove('active');
	});
}); */


// Navbar scroll effect
/* window.addEventListener('scroll', () => {
	const navbar = document.querySelector('.navbar');
	if (window.scrollY > 50) {
		navbar.classList.add('scrolled');
	} else {
		navbar.classList.remove('scrolled');
	}
});
 */
// Countdown Timer
function updateCountdown() {
	const weddingDate = new Date('November 1, 2025 13:00:00').getTime();
	const now = new Date().getTime();
	const distance = weddingDate - now;

	const days = Math.floor(distance / (1000 * 60 * 60 * 24));
	const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((distance % (1000 * 60)) / 1000);

	document.getElementById('days').textContent = days.toString().padStart(2, '0');
	document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
	document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
	document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');

	if (distance < 0) {
		clearInterval(countdownTimer);
		document.querySelector('.countdown-container').innerHTML = '<h3 style="font-size: 2rem;">We\'re Married!</h3>';
	}
}

const countdownTimer = setInterval(updateCountdown, 1000);
updateCountdown();

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	anchor.addEventListener('click', function (e) {
		e.preventDefault();

		const targetId = this.getAttribute('href');
		if (targetId === '#') return;

		const targetElement = document.querySelector(targetId);
		if (targetElement) {
			window.scrollTo({
				top: targetElement.offsetTop - 70,
				behavior: 'smooth'
			});
		}
	});
});

/// Timeline animation
document.addEventListener('DOMContentLoaded', () => {
	const i = document.querySelectorAll('.timeline-item');
	const o = new IntersectionObserver(e => {
		e.forEach(s => {
			if (s.isIntersecting) {
				s.target.classList.add('visible');
				o.unobserve(s.target);
			}
		});
	}, { threshold: .1 });
	i.forEach(i => o.observe(i));
});

/*  new WOW().init(); */

/*  $(".gallery-loop").owlCarousel({
   loop: true,
   margin: 10,
   nav: true,
   autoplay: true,
   autoplayTimeout: 4000,
   smartSpeed: 1200,           // ความเร็ว transition (1.2 วินาที)
   autoplaySpeed: 1200,        // ความเร็วตอน autoplay
   autoplayHoverPause: true,
   animateOut: 'fadeOut',      // ใช้ fade ออก
   animateIn: 'fadeIn' ,       // ใช้ fade เข้า
   responsive: {
	   0: { items: 1 },
	   576: { items: 2 },
	   768: { items: 3 },
	   992: { items: 3 }
   }
 }); */
$(".gallery-loop").owlCarousel({
	loop: true,
	margin: 10,
	nav: true,
	autoplay: true,
	autoplayTimeout: 4000,
	smartSpeed: 1200,
	autoplaySpeed: 1200,
	autoplayHoverPause: true,
	animateOut: 'fadeOut',
	animateIn: 'fadeIn',
	slideBy: 'page',  // 👈 เลื่อนทีละ "หน้า" (เท่ากับจำนวน items ปัจจุบัน)
	responsive: {
		0: { items: 1 },
		576: { items: 2 },
		768: { items: 3 },
		992: { items: 3 }
	}
});
$(".special-loop").owlCarousel({
	loop: true, // ปิดการทำ loop ที่จะ clone รูป
	margin: 10,
	autoplay: true,
	dots: true,
	autoplayTimeout: 3000,
	responsive: {
		0: { items: 1 },
		576: { items: 2 },
		768: { items: 2 },
		992: { items: 2 }
	}
});
$(".location-carousel").owlCarousel({
	loop: false, // ปิดการทำ loop ที่จะ clone รูป
	margin: 10,

	dots: true,

	responsive: {
		0: { items: 1 },
		576: { items: 2 },
		768: { items: 2 },
		992: { items: 3 }
	}
});
document.addEventListener("DOMContentLoaded", function () {
	const iframe = document.getElementById("rsvp-form");
	const loader = document.getElementById("iframe-loader");

	iframe.onload = function () {
		loader.style.display = "none";
	};
});

document.addEventListener('DOMContentLoaded', () => {
	const preloader = document.getElementById('preloader');
	preloader.classList.add('fade-out');
});

(function () {
	const btn = document.getElementById('toTop');
	if (!btn) return;
	window.addEventListener('scroll', () => { btn.style.display = window.scrollY > 600 ? 'flex' : 'none'; });
	btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

document.addEventListener('DOMContentLoaded', () => {
	const root = document.documentElement;
	const nav  = document.querySelector('.nav-links');     // เมนูรายการ
	const toggle = document.querySelector('.menu-toggle'); // ปุ่มแฮมเบอร์เกอร์
  
	// เมื่อกดปุ่มเมนู: toggle class menu-open ที่ <html>
	if (toggle && nav) {
	  toggle.addEventListener('click', () => {
		nav.classList.toggle('active');
		root.classList.toggle('menu-open', nav.classList.contains('active'));
	  });
	  // คลิกลิงก์ในเมนูแล้วปิดเมนู
	  nav.querySelectorAll('a').forEach(a => {
		a.addEventListener('click', () => {
		  nav.classList.remove('active');
		  root.classList.remove('menu-open');
		});
	  });
	}
  
	// ถ้ามีแถบ CTA อยู่ ให้เติมธงเพื่อใส่ padding-bottom (กันบังคอนเทนต์)
	if (document.querySelector('.mobile-cta')) {
	  document.body.classList.add('has-mobile-cta');
	}
  });

  document.addEventListener('click',e=>{
	const b=e.target.closest('.btn'); if(!b) return;
	const r=b.getBoundingClientRect(); b.style.setProperty('--x',(e.clientX-r.left)+'px'); b.style.setProperty('--y',(e.clientY-r.top)+'px');
	b.classList.add('ripple'); setTimeout(()=>b.classList.remove('ripple'),380);
  },{passive:true});


  document.addEventListener('DOMContentLoaded',()=>{
	const els=[...document.querySelectorAll('.event-card,.org-card,.gallery-item,.polaroid')];
	const io=new IntersectionObserver(es=>es.forEach(e=>{
	  if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
	}),{threshold:.12});
	els.forEach(el=>{ el.classList.add('reveal'); io.observe(el); });
  });

  // ต่อท้าย js/main.js
(function(){
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const hero = document.querySelector('.hero'); if(!hero) return;
	const content = hero.querySelector('.hero-content');
	function onScroll(){
	  const y = Math.min(1, window.scrollY/600);
	  hero.style.backgroundPosition = `center ${y*20}px`;
	  if(content) content.style.transform = `translateY(${y*8}px)`;
	}
	window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  })();

  (function(){
	const lat = 13.734491, lng = 99.746216;
	const openBtn = document.getElementById('open-map');
	const copyBtn = document.getElementById('copy-coords');
  
	if (openBtn){
	  openBtn.addEventListener('click', (e)=>{
		e.preventDefault();
		const isApple = /iPad|iPhone|Macintosh/.test(navigator.userAgent);
		const url = isApple
		  ? `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent('ไร่ภาพตะวัน')}`
		  : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
		window.open(url, '_blank', 'noopener');
	  });
	}
	if (copyBtn && navigator.clipboard){
	  copyBtn.addEventListener('click', async ()=>{
		try{
		  await navigator.clipboard.writeText(`${lat}, ${lng}`);
		  copyBtn.textContent = 'คัดลอกแล้ว ✓';
		  setTimeout(()=> copyBtn.textContent = 'คัดลอกพิกัด', 1500);
		}catch(_){}
	  });
	}
  })();

(function(){
  const iframe   = document.getElementById('rsvp-form');
  const loader   = document.getElementById('iframe-loader');
  const fallback = document.getElementById('rsvp-fallback');

  function isInAppBrowser(){
    const ua = navigator.userAgent || '';
    // FB/IG in-app browser fingerprints
    return /\bFBAN|FBAV|FB_IAB|Instagram\b/i.test(ua);
  }

  let loaded = false;
  if (iframe) {
    iframe.addEventListener('load', () => {
      loaded = true;
      if (loader) loader.style.display = 'none';
    });
  }

  // ถ้าเป็น in-app → โชว์ปุ่มสำรองไว้เลย
  if (isInAppBrowser() && fallback) {
    fallback.style.display = 'block';
  }

  // กันกรณี onload ไม่มา/ช้ามาก: รอ ~7s แล้วแสดงปุ่มสำรอง
  setTimeout(() => {
    if (!loaded && fallback) fallback.style.display = 'block';
    if (!loaded && loader)  loader.style.display   = 'none';
  }, 7000);
})();
