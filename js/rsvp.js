// แสดง/ซ่อน container เมื่อเลือกว่าจะมาร่วมงานหรือไม่
document.querySelectorAll('input[name="attendance"]').forEach(el => {
    el.addEventListener('change', function () {
        const guestContainer = document.getElementById('guestCountContainer');
        const guestSelect = document.getElementById('guestCountSelect');
        const otherInput = document.getElementById('otherGuestInputContainer');

       
       

        if (this.value === 'ได้ ฉันยินดีไปร่วมงาน') {
            guestContainer.style.display = 'block';
            guestSelect.setAttribute('required', true);
        } else {
            guestContainer.style.display = 'none';
            guestSelect.value = '';
            guestSelect.removeAttribute('required');
            otherInput.style.display = 'none';
            otherGuest.value = '';
            otherGuest.removeAttribute('required');
        }
    });
});

// แสดงช่อง input เมื่อเลือก "อื่นๆ"
document.getElementById('guestCountSelect').addEventListener('change', function () {
    const otherInput = document.getElementById('otherGuestInputContainer');
    const otherGuest = document.getElementById('otherGuestCount');

    

    if (this.value === 'อื่นๆ') {
        otherInput.style.display = 'block';
        otherGuest.setAttribute('required', true);
    } else {
        otherInput.style.display = 'none';
        otherGuest.value = '';
        otherGuest.removeAttribute('required');
    }
});

/*  // แสดง/ซ่อนจำนวนแขกเมื่อเลือก "ได้"
 document.querySelectorAll('input[name="attendance"]').forEach(el => {
     el.addEventListener('change', function () {
         const guestCountContainer = document.getElementById('guestCountContainer');
         if (this.value === 'ได้ ฉันยินดีไปร่วมงาน') {
             guestCountContainer.style.display = 'block';
         } else {
             guestCountContainer.style.display = 'none';
             // รีเซ็ตค่าหากไม่เลือก
             document.querySelectorAll('input[name="guestCount"]').forEach(radio => radio.checked = false);
             document.getElementById('otherGuestInputContainer').style.display = 'none';
             document.getElementById('otherGuestCount').value = '';
         }
     });
 });

 // แสดงช่องกรอกจำนวนแขกเมื่อเลือก "อื่นๆ"
 document.querySelectorAll('input[name="guestCount"]').forEach(radio => {
     radio.addEventListener('change', function () {
         const otherGuestInput = document.getElementById('otherGuestInputContainer');
         if (this.value === 'อื่นๆ') {
             otherGuestInput.style.display = 'block';
             document.getElementById('otherGuestCount').setAttribute('required', true);
         } else {
             otherGuestInput.style.display = 'none';
             document.getElementById('otherGuestCount').removeAttribute('required');
             document.getElementById('otherGuestCount').value = '';
         }
     });
 }); */

/*  document.querySelectorAll('input[name="attendance"]').forEach(el => {
el.addEventListener('change', function () {
 const guestCountContainer = document.getElementById('guestCountContainer');
 if (this.value === 'ได้ ฉันยินดีไปร่วมงาน') {
   guestCountContainer.style.display = 'block';
   document.getElementById('guestCount').setAttribute('required', true);
 } else {
   guestCountContainer.style.display = 'none';
   document.getElementById('guestCount').value = '';
   document.getElementById('guestCount').removeAttribute('required');
 }
});
}); */

document.getElementById('rsvpForm').addEventListener('submit', function (e) {
    e.preventDefault();

     const submitBtn = document.querySelector('.ff-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons">hourglass_top</span> กำลังส่ง...';

    const formData = {
        name: document.getElementById('name').value.trim(),
        attendance: document.querySelector('input[name="attendance"]:checked')?.value,
        side: document.querySelector('input[name="side"]:checked')?.value,
        guestCount: document.getElementById('guestCountSelect').value === 'อื่นๆ'
        ? document.getElementById('otherGuestCount').value
        : document.getElementById('guestCountSelect').value,
        message: document.getElementById('message').value.trim()
    };

    if (formData.attendance === 'ได้ ฉันยินดีไปร่วมงาน' && (!formData.guestCount || isNaN(formData.guestCount) || formData.guestCount < 1)) {
        alert('กรุณาระบุจำนวนแขกให้ถูกต้อง');
        return;
    }

    if (!formData.name || !formData.attendance || !formData.side) {
        alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
        return;
    }

    /* google.script.run
        .withSuccessHandler(() => {
            document.getElementById('rsvpForm').style.display = 'none';

            // แสดงข้อความขอบคุณ
            const successMessage = document.getElementById('success-message');
            successMessage.style.display = 'block';
            // เลื่อนไปยังข้อความ
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .withFailureHandler(error => {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        })
        .submitForm(formData); */
        fetch("https://script.google.com/macros/s/AKfycbyUUlaqKoiqZ9b2yIqLOLcoMm5Pr_Ik8S51cOhaebc2VWmn6he8-8tV-svEQiloAhw/exec", {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(res => {
            if (res.status === 'success') {
                document.getElementById('rsvpForm').style.display = 'none';
                const successMessage = document.getElementById('success-message');
                successMessage.style.display = 'block';
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                alert('เกิดข้อผิดพลาด: ' + res.message);
            }
        })
        .catch(err => {
            alert('การเชื่อมต่อผิดพลาด: ' + err.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-icons">send</span><span>ส่งแบบตอบรับ</span>';
        });
});