/**
 * jdrides - Main JavaScript File
 * E-Scooty rental booking with Google Sheets & WhatsApp Integration
 */

// =========================================================================
// 🔴 GOOGLE APPS SCRIPT WEB APP URL (LIVE CONNECTED):
// =========================================================================
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyGr64-3PHhZJONdZo-xD_GEF-0xG0AAsNsG719vzXi3ojXbkDeqeukZZDGKR4zROIDdg/exec"; 
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {
  // Update copyright year
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Helper function to send lead data to Google Sheet
  function sendLeadToGoogleSheet(payload) {
    if (!GOOGLE_SHEET_WEB_APP_URL || GOOGLE_SHEET_WEB_APP_URL.trim() === "") {
      console.log("Google Sheet URL not configured yet. Lead data:", payload);
      return;
    }

    // Send via URLSearchParams for no-cors Google Apps Script support
    const formData = new URLSearchParams();
    for (const key in payload) {
      formData.append(key, payload[key]);
    }

    fetch(GOOGLE_SHEET_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })
    .then(() => {
      console.log("Lead successfully sent to Google Sheet!");
    })
    .catch((err) => {
      console.error("Error sending lead to Google Sheet:", err);
    });
  }

  // 1. AUTO-OPEN CONTACT MODAL ON FIRST VISIT ACROSS ALL PAGES
  const autoModalElement = document.getElementById('autoContactModal');
  if (autoModalElement && typeof bootstrap !== 'undefined') {
    const hasSeenModal = sessionStorage.getItem('jdrides_modal_shown');
    
    if (!hasSeenModal) {
      setTimeout(() => {
        const contactModal = new bootstrap.Modal(autoModalElement, {
          keyboard: true
        });
        contactModal.show();
        sessionStorage.setItem('jdrides_modal_shown', 'true');
      }, 1200);
    }
  }

  // 2. BOOKING FORM HANDLER (Direct Google Sheet save + WhatsApp dispatch)
  const bookingForms = document.querySelectorAll('.rental-booking-form');
  bookingForms.forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const name = form.querySelector('[name="customer_name"]')?.value || 'Customer';
      const phone = form.querySelector('[name="customer_phone"]')?.value || '';
      const vehicle = form.querySelector('[name="vehicle_type"]')?.value || 'White E-Scooty (Daily ₹249)';
      const pickupDate = form.querySelector('[name="pickup_date"]')?.value || 'Immediately';
      const duration = form.querySelector('[name="rental_duration"]')?.value || '1 Day';
      const notes = form.querySelector('[name="customer_notes"]')?.value || '';
      const isModal = form.closest('#autoContactModal') ? 'Auto Popup Modal' : 'Home/Pricing Form';

      // 1. Send data to Google Sheet
      sendLeadToGoogleSheet({
        customer_name: name,
        customer_phone: phone,
        vehicle_type: vehicle,
        rental_duration: duration,
        pickup_date: pickupDate,
        customer_notes: notes + ' | DL & Aadhar verified',
        lead_source: isModal
      });

      // 2. Construct WhatsApp message for jdrides owner (+91 95821 16104)
      let message = `*New White E-Scooty Booking - jdrides*%0A%0A`;
      message += `*Customer Name:* ${encodeURIComponent(name)}%0A`;
      message += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      message += `*Vehicle:* ${encodeURIComponent(vehicle)}%0A`;
      message += `*Rate:* ₹249/Day%0A`;
      message += `*Duration:* ${encodeURIComponent(duration)}%0A`;
      message += `*Pickup Date:* ${encodeURIComponent(pickupDate)}%0A`;
      message += `*Documents:* Driving License & Aadhar Card Ready%0A`;
      if (notes) {
        message += `*Notes:* ${encodeURIComponent(notes)}%0A`;
      }
      message += `%0A_Sent via jdrides website enquiry form._`;

      // 3. Show friendly confirmation
      const alertBox = form.querySelector('.form-alert');
      if (alertBox) {
        alertBox.innerHTML = `
          <div class="alert alert-success alert-dismissible fade show mt-3" role="alert">
            <i class="fa-solid fa-circle-check me-2"></i> Thank you, <strong>${name}</strong>! Your White E-Scooty request has been saved. Redirecting to WhatsApp for instant confirmation...
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>
        `;
      } else {
        alert(`Thank you, ${name}! Your booking request has been saved. Our team will contact you shortly.`);
      }

      // 4. Open WhatsApp with owner's number
      setTimeout(() => {
        window.open(`https://wa.me/919582116104?text=${message}`, '_blank');
        form.reset();
        if (autoModalElement) {
          const instance = bootstrap.Modal.getInstance(autoModalElement);
          if (instance) instance.hide();
        }
      }, 1500);
    });
  });

  // 3. CONTACT US INQUIRY FORM (contact.html)
  const generalContactForm = document.getElementById('generalContactForm');
  if (generalContactForm) {
    generalContactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const alertBox = document.getElementById('contactFormAlert');
      const name = document.getElementById('contactName')?.value || 'Friend';
      const phone = document.getElementById('contactPhone')?.value || '';
      const email = document.getElementById('contactEmail')?.value || '';
      const vehicle = document.getElementById('contactVehicle')?.value || 'White E-Scooty (Daily ₹249)';
      const message = document.getElementById('contactMessage')?.value || '';

      // Send to Google Sheet
      sendLeadToGoogleSheet({
        customer_name: name,
        customer_phone: phone + (email ? ' | ' + email : ''),
        vehicle_type: vehicle,
        rental_duration: 'Contact Page Inquiry',
        pickup_date: 'As discussed',
        customer_notes: message,
        lead_source: 'Contact Us Page Form'
      });

      if (alertBox) {
        alertBox.innerHTML = `
          <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fa-solid fa-circle-check me-2"></i> Thank you, <strong>${name}</strong>! We have received your inquiry. Our team at jdrides (Tri Nagar) will get back to you immediately on <strong>${phone}</strong>.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>
        `;
      }
      generalContactForm.reset();
    });
  }

  // 4. GALLERY FILTERING
  const filterButtons = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (filterButtons.length > 0 && galleryItems.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const filterValue = this.getAttribute('data-filter');

        galleryItems.forEach(item => {
          if (filterValue === 'all' || item.classList.contains(filterValue)) {
            item.style.display = 'block';
            setTimeout(() => { item.style.opacity = '1'; }, 50);
          } else {
            item.style.opacity = '0';
            setTimeout(() => { item.style.display = 'none'; }, 200);
          }
        });
      });
    });
  }

  // 5. INITIALIZE AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50
    });
  }
});
