
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
document.addEventListener('DOMContentLoaded',()=>{
	const i=document.querySelectorAll('.timeline-item');
	const o=new IntersectionObserver(e=>{
	  e.forEach(s=>{
		if(s.isIntersecting){
		  s.target.classList.add('visible');
		  o.unobserve(s.target);
		}
	  });
   },{threshold:.1});
	i.forEach(i=>o.observe(i));
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
  
   
  
  