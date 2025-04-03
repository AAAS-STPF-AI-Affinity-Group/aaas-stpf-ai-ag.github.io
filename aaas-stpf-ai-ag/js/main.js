document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = nav.contains(event.target);
        const isClickOnMenuBtn = mobileMenuBtn.contains(event.target);
        
        if (nav.classList.contains('active') && !isClickInsideNav && !isClickOnMenuBtn) {
            nav.classList.remove('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
            
            // Close mobile menu after clicking a link
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
            }
        });
    });
    
    // Highlight active nav item based on scroll position
    function highlightNavItem() {
        const sections = document.querySelectorAll('section[id]');
        const navItems = document.querySelectorAll('nav ul li a');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + currentSection) {
                item.classList.add('active');
            }
        });
    }
    
    // Add fade-in animation for elements as they scroll into view
    const fadeInElements = document.querySelectorAll('.fade-in');
    
    function checkFadeInElements() {
        fadeInElements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 50) {
                element.classList.add('visible');
            }
        });
    }
    
    // Event listeners for scroll effects
    if (fadeInElements.length > 0) {
        window.addEventListener('scroll', checkFadeInElements);
        checkFadeInElements(); // Check on initial load
    }
    
    // Initialize any third-party libraries or components
    // Example: Initialize a carousel if it exists
    // if (document.querySelector('.carousel')) {
    //     new Carousel('.carousel', {
    //         // options
    //     });
    // }
    
    // Form validation for contact form
    const contactForm = document.querySelector('#contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const required = this.querySelectorAll('[required]');
            let isValid = true;
            
            required.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    
                    const errorMessage = field.getAttribute('data-error') || 'This field is required';
                    
                    // Create or update error message
                    let errorEl = field.nextElementSibling;
                    if (errorEl && errorEl.classList.contains('error-message')) {
                        errorEl.textContent = errorMessage;
                    } else {
                        errorEl = document.createElement('div');
                        errorEl.classList.add('error-message');
                        errorEl.textContent = errorMessage;
                        field.parentNode.insertBefore(errorEl, field.nextSibling);
                    }
                } else {
                    field.classList.remove('error');
                    
                    // Remove error message if it exists
                    const errorEl = field.nextElementSibling;
                    if (errorEl && errorEl.classList.contains('error-message')) {
                        errorEl.remove();
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    }
});