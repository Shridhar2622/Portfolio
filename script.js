// ---- 0. Global Context State ----
window.siteStartTime = Date.now();
window.isPlayingBreakout = false;
window.isAudioPlaying = false;
window.currentAudioTrackName = "";

document.addEventListener('DOMContentLoaded', () => {

    // ---- 1. Initialize Particles.js ----
    if (typeof particlesJS !== "undefined") {
        particlesJS.load('particles-js', 'asset/particles.json', function() {
            console.log('particles.js loaded');
        });
    }

    // ---- 2. GSAP Enhanced Animations ----
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);

        // 2a. Masked Cinematic Intro (GTA Style)
        const mainTl = gsap.timeline();
        const welcomeText = "WELCOME";
        const maskText = document.getElementById('welcome-svg-text');

        // Initial setup
        gsap.set(".intro-overlay", { opacity: 1, display: "flex" });
        gsap.set(".navbar", { autoAlpha: 0 });
        if(maskText) maskText.textContent = "";

        // 1. Typing Effect (Inside the SVG mask)
        mainTl.to({}, {
            duration: 0.8,
            ease: "none",
            onUpdate: function() {
                const prog = this.progress();
                const count = Math.ceil(prog * welcomeText.length);
                if(maskText) maskText.textContent = welcomeText.slice(0, count);
            }
        });

        // 2. Pause and then GTA Cinematic Reveal
        // The text is a hole in the black overlay. Scaling it up reveals the site.
        mainTl.to(maskText, {
            scale: 150, // Massive scale to clear the screen
            transformOrigin: "50% 50%",
            duration: 1.2,
            ease: "expo.in"
        }, "+=0.3")
        .to(".intro-svg", {
            autoAlpha: 0,
            duration: 0.4,
            ease: "none"
        }, "-=0.2")
        .set(".intro-overlay", { display: "none" }); // Ensure it stops blocking clicks

        // 3. Reveal Navbar and Rest of Site
        mainTl.fromTo(".navbar", 
            { y: -50, autoAlpha: 0 }, 
            { y: 0, autoAlpha: 1, duration: 0.8 },
            "-=0.2"
        );

        // Stagger hero elements popping up
        const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-desc, .hero-social-links, .hero-terminal');
        if (heroElements.length > 0) {
            mainTl.fromTo(heroElements,
                { y: 30, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 },
                "-=0.5"
            );
        }

        // 2b. Continuous Floating Motion for Hero Background Icons and Avatar
        // Random drift using GSAP yoyo
        const floatingIcons = gsap.utils.toArray('.floating-icon');
        if (floatingIcons.length > 0) {
            floatingIcons.forEach(icon => {
                gsap.to(icon, {
                    y: "random(-40, 40)",
                    x: "random(-20, 20)",
                    rotation: "random(-25, 25)",
                    duration: "random(4, 7)",
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1
                });
            });
        }

        // Gently float the avatar wrapper continuously
        const avatar = document.querySelector('.avatar');
        if (avatar) {
            gsap.to(avatar, {
                y: -15,
                rotation: 2,
                duration: 3,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1
            });
        }

        // 2c. ScrollTrigger Section Reveal (Wow Factor while scrolling)
        const sections = document.querySelectorAll('.scroll-section');
        sections.forEach(sec => {
            // First animate the section title
            const title = sec.querySelector('.section-title');
            if (title) {
                gsap.fromTo(title,
                    { y: 40, autoAlpha: 0 },
                    {
                        y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out",
                        scrollTrigger: {
                            trigger: sec,
                            start: "top 80%",
                        }
                    }
                );
            }

            // Stagger multiple cards if present, otherwise just fade the content up
            const cards = sec.querySelectorAll('.card');
            const content = sec.querySelector('.card, .section-content');
            if (cards.length > 1 && sec.classList.contains('stagger-cards')) {
                gsap.fromTo(cards,
                    { y: 60, autoAlpha: 0, scale: 0.95 },
                    {
                        y: 0, autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)",
                        scrollTrigger: {
                            trigger: sec,
                            start: "top 75%",
                        }
                    }
                );
            } else if (content) {
                gsap.fromTo(content, // Fallback to animating the card itself if no section-content wrapper exists
                    { y: 40, autoAlpha: 0 },
                    {
                        y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out", delay: 0.2, // slightly after title
                        scrollTrigger: {
                            trigger: sec,
                            start: "top 80%",
                        }
                    }
                );
            }
            
            // Special handling: Sequence the About image reveal (Wait -> Bar -> Container Height & Card Height -> Photo)
            const aboutCard = sec.querySelector('.about-card');
            const revealWrapper = sec.querySelector('.about-reveal-wrapper');
            const revealImg = sec.querySelector('.about-reveal-img');
            if(revealWrapper && revealImg && aboutCard) {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: sec,
                        start: "top 70%", // Trigger when section is 70% from the top
                        toggleActions: "play none none reverse" // Play on scroll down, reverse strictly on scroll back up past the trigger
                    }
                });
                
                tl.to(revealWrapper, { width: "100%", duration: 0.6, ease: "power3.inOut" }) // 1. Draw the horizontal line
                  .to(aboutCard, { paddingBottom: 85, duration: 0.8, ease: "power3.inOut" }, "+=0") // 2. Add padding to bottom of card
                  .to(revealWrapper, { height: "350px", duration: 0.8, ease: "power3.inOut" }, "<") // 3. Expand wrapper vertically
                  .to(revealImg, { opacity: 1, filter: "grayscale(100%)", duration: 0.8, ease: "power2.out" }, "-=0.4"); // 4. Reveal photo (start grayscale)
            }
        });
    }


    // ---- 3. Interactive Floating Particles Canvas Background ----
    function initBackground() {
        const canvas = document.getElementById('bg-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        
        let width, height;
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();
        
        const particles = [];
        const particleCount = window.innerWidth < 768 ? 40 : 100;
        
        for(let i=0; i<particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                color: `rgba(${Math.floor(Math.random()*100 + 155)}, ${Math.floor(Math.random()*100 + 155)}, 255, ${Math.random()*0.5 + 0.2})`
            });
        }
        
        let mx = -1000, my = -1000;
        window.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
        });
        
        function draw() {
            ctx.clearRect(0, 0, width, height);
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                
                if(p.x < -50) p.x = width + 50;
                if(p.x > width + 50) p.x = -50;
                if(p.y < -50) p.y = height + 50;
                if(p.y > height + 50) p.y = -50;
                
                const dx = mx - p.x;
                const dy = my - p.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 150) {
                    p.x -= dx * 0.015;
                    p.y -= dy * 0.015;
                }
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });
            
            for(let i=0; i<particles.length; i++){
                for(let j=i+1; j<particles.length; j++){
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if(dist < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(200, 182, 255, ${(1 - dist/100) * 0.2})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            
            requestAnimationFrame(draw);
        }
        draw();
    }
    initBackground();

    // ---- 4. Contact Form Submission (FormSubmit.co) ----
    const contactForm = document.querySelector('.contact-form');
    if(contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('.submit-btn');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = 'Sending... <i class=\'bx bx-loader-alt bx-spin\'></i>';
            btn.disabled = true;
            
            const formData = new FormData(contactForm);
            
            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.ok) {
                    btn.innerHTML = 'Message Sent! ✨';
                    btn.style.background = 'linear-gradient(135deg, var(--accent-2), var(--accent-3))';
                    contactForm.reset();
                } else {
                    const data = await response.json();
                    throw new Error(data.message || 'Form submission failed');
                }
            } catch (error) {
                btn.innerHTML = 'Oops! Error ❌';
                btn.style.background = '#ff5f56';
            } finally {
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // ---- 4.1 Mobile Menu Toggle ----
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.className = 'bx bx-x';
            } else {
                icon.className = 'bx bx-menu-alt-right';
            }
        });

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').className = 'bx bx-menu-alt-right';
            });
        });
    }

    // ---- 4.5 Terminal Breakout Game Logic ----
    const gameCanvas = document.getElementById('atari-game');
    const sideTerminal = document.querySelector('.hero-terminal');
    
    if (gameCanvas && sideTerminal) {
        const ctx = gameCanvas.getContext('2d');
        let gameLoop;
        let isHovering = false;
        let score = 0;
        let lastTime = 0;

        // Player Paddle
        const paddle = { x: gameCanvas.width/2 - 35, y: gameCanvas.height - 30, w: 70, h: 10, color: '#69f0ae' };
        // The Ball
        const ball = { x: gameCanvas.width/2, y: gameCanvas.height - 80, r: 5, dx: 3, dy: -3, speed: 4, color: '#fff' };
        
        // Bricks (derived from the terminal text lines)
        let bricks = [];
        const termLines = Array.from(document.querySelectorAll('.terminal-content .term-line'));

        function resizeGame() {
            const container = gameCanvas.parentElement;
            if (container) {
                gameCanvas.width = container.clientWidth;
                gameCanvas.height = 420; // Maintain consistent height
            }
            if (typeof drawGame === 'function') drawGame();
        }
        window.addEventListener('resize', () => {
            resizeGame();
            initBricks();
        });
        resizeGame();
        
        // Simple function to build the brick matrix
        function initBricks() {
            bricks = [];
            const rows = termLines.length; // Now 6 rows of text
            const cols = 6; 
            const padding = 8;
            const offsetTop = 40;
            const offsetLeft = 15;
            const width = (gameCanvas.width - (offsetLeft * 2) - (padding * (cols - 1))) / cols;
            const height = 12;

            // Colors based on retro hacker terminal vibes
            const colors = ['#69f0ae', '#ff5f56', '#ffbd2e', '#27c93f', '#a2d2ff', '#cdb4db'];

            for (let r = 0; r < rows; r++) {
                // If there's text, we make a row of bricks representing that "text string"
                for (let c = 0; c < cols; c++) {
                    bricks.push({
                        x: offsetLeft + c * (width + padding),
                        y: offsetTop + r * (height + padding),
                        w: width,
                        h: height,
                        status: 1, // 1 = visible, 0 = broken
                        color: colors[r % colors.length]
                    });
                }
            }
        }

        initBricks();

        // Mouse tracking for player paddle
        sideTerminal.addEventListener('mousemove', (e) => {
            if(!isHovering) return;
            const rect = gameCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            paddle.x = Math.max(0, Math.min(mouseX - paddle.w/2, gameCanvas.width - paddle.w));
        });

        sideTerminal.addEventListener('mouseenter', () => {
            isHovering = true;
            window.isPlayingBreakout = true;
            if(!gameLoop) {
                lastTime = performance.now();
                gameLoop = requestAnimationFrame(updateGame);
            }
        });

        sideTerminal.addEventListener('mouseleave', () => {
            isHovering = false;
            window.isPlayingBreakout = false;
            cancelAnimationFrame(gameLoop);
            gameLoop = null;
        });

        function resetBall() {
            ball.x = gameCanvas.width / 2;
            ball.y = gameCanvas.height / 2;
            ball.dy = -ball.speed; 
            ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
        }

        function updateGame(currentTime) {
            if(!isHovering) return;

            // Calculate delta time
            const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps (16.67ms)
            lastTime = currentTime;

            // Move ball
            ball.x += ball.dx * deltaTime;
            ball.y += ball.dy * deltaTime;

            // Wall collisions (Left/Right/Top)
            if (ball.x + ball.r > gameCanvas.width || ball.x - ball.r < 0) {
                ball.dx = -ball.dx;
            }
            if (ball.y - ball.r < 0) {
                ball.dy = -ball.dy;
            }

            // Paddle collision
            if (ball.y + ball.r > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
                ball.dy = -Math.abs(ball.dy); // Force up
                
                // Add spin based on hit location
                let hitPoint = ball.x - (paddle.x + paddle.w/2);
                ball.dx = hitPoint * 0.15;
                
                // Normalize speed vector completely
                const currentSpeed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy);
                ball.dx = (ball.dx / currentSpeed) * ball.speed;
                ball.dy = (ball.dy / currentSpeed) * ball.speed;
                // Double check it's definitely going up
                if(ball.dy > 0) ball.dy = -ball.dy;
            }

            // Brick collision detection
            let activeBricks = 0;
            for (let i = 0; i < bricks.length; i++) {
                let b = bricks[i];
                if (b.status === 1) {
                    activeBricks++;
                    if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
                        ball.dy = -ball.dy;
                        b.status = 0; // Break it
                        score += 10;
                        
                        // Re-normalize slightly to keep speed stable after collision
                        const currentSpeed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy);
                        ball.dx = (ball.dx / currentSpeed) * ball.speed;
                        ball.dy = (ball.dy / currentSpeed) * ball.speed;
                    }
                }
            }

            // Win condition (all broke) -> reset board
            if (activeBricks === 0) {
                initBricks();
                resetBall();
                ball.speed += 0.5; // Slightly faster next round
            }

            // Death condition (fell out bottom)
            if (ball.y + ball.r > gameCanvas.height) {
                score = 0; 
                ball.speed = 4; // Reset speed
                initBricks(); // Reset board on death
                resetBall();
            } 

            drawGame();
            gameLoop = requestAnimationFrame(updateGame);
        }

        function drawGame() {
            // Clear
            ctx.fillStyle = 'rgba(10, 10, 15, 1)';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

            // Draw Bricks
            bricks.forEach(b => {
                if (b.status === 1) {
                    ctx.fillStyle = b.color;
                    ctx.fillRect(b.x, b.y, b.w, b.h);
                    ctx.strokeStyle = '#000'; // slight border 
                    ctx.strokeRect(b.x, b.y, b.w, b.h);
                }
            });

            // Draw Paddle
            ctx.fillStyle = paddle.color;
            ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
            
            // Draw Ball
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.fill();
            ctx.closePath();

            // Draw Score
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '24px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText("SCORE:" + score, 15, 25);
        }

        // Initial draw
        drawGame();
    }


    // ---- 5. Matter.js Box Drop (Card Hover -> Magic Box Appears & Icons Fall!) ----
    if (typeof Matter !== 'undefined') {
        const Engine = Matter.Engine,
              Runner = Matter.Runner,
              MouseConstraint = Matter.MouseConstraint,
              Mouse = Matter.Mouse,
              Composite = Matter.Composite,
              Bodies = Matter.Bodies;

        const skillCards = document.querySelectorAll('.skill-category-card');

        skillCards.forEach(card => {
            const container = card.querySelector('.skills-physics-container');
            const iconNodes = Array.from(container.querySelectorAll('.physics-icon'));
            
            let engine = null;
            let runner = null;
            let dropTimeouts = [];
            let destroyTimeout = null;
            // Reset icons back to hidden state with a lightning-fast natural transition
            function destroyPhysics() {
                dropTimeouts.forEach(clearTimeout);
                dropTimeouts = [];

                if (iconNodes.length > 0) {
                    gsap.to(iconNodes, {
                        opacity: 0,
                        y: "-=10", 
                        scale: 0.98,
                        duration: 2, // Lightning fast exit
                        stagger: 0.01,
                        ease: "power1.in",
                        overwrite: true,
                        onComplete: () => {
                            // Final cleanup only if mouse didn't come back
                            if (card.matches(':hover')) return; 

                            if (engine) {
                                Matter.Engine.clear(engine);
                                if (runner) Matter.Runner.stop(runner);
                                engine = null;
                                runner = null;
                            }
                            iconNodes.forEach(icon => {
                                icon.style.top = '-100px'; 
                                icon.style.transform = 'none'; 
                                icon.style.opacity = '0';
                            });
                            card.classList.remove('active-drop');
                        }
                    });
                } else {
                    card.classList.remove('active-drop');
                }
            }

            card.addEventListener('mouseenter', () => {
                triggerDrop();
            });

            // Touch support for mobile
            card.addEventListener('touchstart', (e) => {
                if (!card.classList.contains('active-drop')) {
                    e.preventDefault(); // Prevent scrolling if it's the first touch
                    triggerDrop();
                }
            }, { passive: false });

            function triggerDrop() {
                clearTimeout(destroyTimeout); 
                gsap.killTweensOf(iconNodes); // Stop any exit fade
                
                // If the engine is already there, just restore visibility and keep going
                if (engine) {
                    gsap.to(iconNodes, { opacity: 1, scale: 1, duration: 0.1 });
                    card.classList.add('active-drop');
                    return;
                }

                if (card.classList.contains('active-drop')) return;
                card.classList.add('active-drop');

                engine = Engine.create();
                engine.gravity.y = 2.0;

                const width = card.clientWidth || 300; 
                const height = card.clientHeight || 250; 
                
                const thickness = 50;
                const wallOptions = { isStatic: true, render: { visible: false } };
                
                const ground = Bodies.rectangle(width/2, height + thickness/2, width + 100, thickness, wallOptions);
                const leftWall = Bodies.rectangle(-thickness/2, height/2, thickness, height + 100, wallOptions);
                const rightWall = Bodies.rectangle(width + thickness/2, height/2, thickness, height + 100, wallOptions);
                const ceiling = Bodies.rectangle(width/2, -thickness * 20, width + 100, thickness, wallOptions);
                
                Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);
                
                const mouse = Mouse.create(container);
                const mouseConstraint = MouseConstraint.create(engine, {
                    mouse: mouse,
                    constraint: { stiffness: 0.2, render: { visible: false } }
                });
                
                mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
                mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
                
                Composite.add(engine.world, mouseConstraint);

                let bodiesData = [];

                Matter.Events.on(engine, 'afterUpdate', function() {
                    bodiesData.forEach(item => {
                        const { body, el, w, h } = item;
                        el.style.transform = `translate(${body.position.x - w/2}px, ${body.position.y - h/2}px) rotate(${body.angle}rad)`;
                    });
                });

                runner = Runner.create();
                Runner.run(runner, engine);

                const iconsCount = iconNodes.length;
                const spacing = width / (iconsCount + 1);

                iconNodes.forEach((icon, i) => {
                    const color = icon.getAttribute('data-color');
                    if(color) {
                        icon.style.borderColor = color;
                        icon.style.color = color;
                        icon.style.boxShadow = `0 0 20px ${color}90, inset 0 0 10px ${color}40`; 
                    }

                    const w = 60, h = 60; 
                    
                    let t = setTimeout(() => {
                        if(!engine) return; 
                        
                        icon.style.top = '0px';
                        icon.style.opacity = '1';

                        const dropX = spacing * (i + 1);
                        const dropY = -h - 5; 

                        const body = Bodies.rectangle(dropX, dropY, w, h, {
                            restitution: 0.3, 
                            friction: 0.5, 
                            frictionAir: 0.01,
                            chamfer: { radius: 10 },
                            angle: 0 
                        });
                        
                        bodiesData.push({ body, el: icon, w, h });
                        Composite.add(engine.world, body);
                        
                    }, i * 15); 
                    dropTimeouts.push(t);
                });
            }

            card.addEventListener('mouseleave', () => {
                destroyTimeout = setTimeout(destroyPhysics, 50); 
            });
        });
    }

    // ---- 6. Interactive Flying Bees (Lazy Orbit & Cute Interactions) ----
    const bees = document.querySelectorAll('.bee-container');
    
    if (bees.length > 0 && typeof gsap !== 'undefined') {
        const beeData = Array.from(bees).map((bee, index) => ({
            el: bee,
            beeAngle: index * Math.PI, 
            beeAngleY: index * (Math.PI / 2),
            beeX: -100,
            beeY: -100,
            baseSpeedX: 0.003 + (Math.random() * 0.002), 
            baseSpeedY: 0.004 + (Math.random() * 0.002),
            orbitSpeedX: 0.003 + (Math.random() * 0.002),
            orbitSpeedY: 0.004 + (Math.random() * 0.002),
            radiusScale: 0.8 + (Math.random() * 0.4),
            isExamining: false,
            scaleBounce: 1,
            customMessageTime: 0,
            customMessage: ""
        }));
        
        let flowerActive = false;
        let flowerOffTime = 0;
        const flowerBtn = document.getElementById('flower-btn');
        if (flowerBtn) {
            flowerBtn.addEventListener('click', () => {
                flowerActive = !flowerActive;
                flowerBtn.classList.toggle('active', flowerActive);
                
                beeData.forEach(data => {
                    data.customMessage = flowerActive ? "Ouu flower" : "Missed u";
                    data.customMessageTime = Date.now();
                    
                    if (!flowerActive) {
                        flowerOffTime = Date.now();
                    } else {
                        data.el.style.opacity = '1';
                        data.scaleBounce = 1.2; // Tiny jump of excitement
                    }
                });
            });
        }

        window.beeMouseX = -1000;
        window.beeMouseY = -1000;
        
        window.addEventListener('mousemove', (e) => {
            window.beeMouseX = e.clientX;
            window.beeMouseY = e.clientY;
        });

        gsap.ticker.add(() => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            beeData.forEach(data => {
                const dxMouse = window.beeMouseX - data.beeX;
                const dyMouse = window.beeMouseY - data.beeY;
                const distToMouse = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);

                const timeSinceCustomMsg = Date.now() - data.customMessageTime;
                const timeSpentSeconds = (Date.now() - window.siteStartTime) / 1000;
                
                // If flower is off, wait tiny bit before they speak and enter
                let delayReturning = (!flowerActive && flowerOffTime > 0 && Date.now() - flowerOffTime < 300);
                const isShowingCustomMsg = !delayReturning && timeSinceCustomMsg < 3500;

                // Dynamic Context-Aware Bubble Contents
                let bubbleContents = ["Bzz!", "Hi there!", "Cute cursor!", "What's this?", "Zzz...", "Follow you!", "Are you lost?", "I like your style!", "Nice coding!", "Just vibing."];


                // 1. Determine interaction states and bubbles
                if (flowerActive) {
                    data.isExamining = false; // Override mouse interaction
                    if (isShowingCustomMsg) {
                        data.el.classList.add('examining');
                        const bubble = data.el.querySelector('.bee-bubble');
                        if (bubble) bubble.innerText = data.customMessage;
                    } else {
                        data.el.classList.remove('examining');
                    }
                } else if (delayReturning) {
                    data.el.classList.remove('examining');
                } else if (isShowingCustomMsg) {
                    data.isExamining = false;
                    data.el.classList.add('examining');
                    const bubble = data.el.querySelector('.bee-bubble');
                    if (bubble) bubble.innerText = data.customMessage;
                } else {
                    // Normal Mouse Interaction
                    if (distToMouse < 90) {
                        if (!data.isExamining) {
                            data.isExamining = true;
                            data.el.classList.add('examining');
                            const bubble = data.el.querySelector('.bee-bubble');
                            if (bubble) bubble.innerText = bubbleContents[Math.floor(Math.random() * bubbleContents.length)];
                        }
                        data.orbitSpeedX *= 0.9; 
                        data.orbitSpeedY *= 0.9;
                        data.scaleBounce += (1.3 - data.scaleBounce) * 0.2;
                    } else {
                        if (data.isExamining) {
                            data.isExamining = false;
                            data.el.classList.remove('examining');
                        }
                        data.orbitSpeedX += (data.baseSpeedX - data.orbitSpeedX) * 0.05;
                        data.orbitSpeedY += (data.baseSpeedY - data.orbitSpeedY) * 0.05;
                        data.scaleBounce += (1 - data.scaleBounce) * 0.1;
                        
                        data.el.classList.remove('examining'); // Ensures custom message disappears
                    }
                }

                // 2. Calculate Targets
                data.beeAngle += data.orbitSpeedX;
                data.beeAngleY += data.orbitSpeedY;
                
                let targetX, targetY, flightSpeed;

                if (flowerActive) {
                    // Fly up to top right gently to OFF SCREEN
                    targetX = window.innerWidth + 200;
                    targetY = -200;
                    flightSpeed = 0.015; // smooth relaxed pace
                } else if (delayReturning) {
                    // Park completely off screen while waiting
                    targetX = window.innerWidth + 200;
                    targetY = -200;
                    data.beeX = targetX;
                    data.beeY = targetY;
                    flightSpeed = 1; 
                } else {
                    const radiusX = window.innerWidth * 0.4 * data.radiusScale;
                    const radiusY = window.innerHeight * 0.35 * data.radiusScale;
                    targetX = centerX + Math.sin(data.beeAngle) * radiusX;
                    targetY = centerY + Math.cos(data.beeAngleY) * radiusY;

                    if (isShowingCustomMsg) {
                        // Enter stage smoothly to resume natural lazylorbit, NOT tracking mouse
                        flightSpeed = 0.012;
                    } else if (!data.isExamining && distToMouse < 400 && distToMouse > 90) { 
                        const curiosityPull = 1 - (distToMouse / 400); 
                        targetX += dxMouse * (curiosityPull * 0.4); 
                        targetY += dyMouse * (curiosityPull * 0.4);
                        flightSpeed = 0.012;
                    } else if (data.isExamining) {
                        targetX = window.beeMouseX - 20;
                        targetY = window.beeMouseY + 10;
                        flightSpeed = 0.08;
                    } else {
                        flightSpeed = 0.012;
                    }
                }

                data.beeX += (targetX - data.beeX) * flightSpeed;
                data.beeY += (targetY - data.beeY) * flightSpeed;
                
                // 3. Keep opacity and scale normal as they fly completely off-screen
                data.el.style.opacity = '1';

                // 4. Transform and Flipping (Fixing the bubble flip issue)
                const vx = targetX - data.beeX;
                const vy = targetY - data.beeY;
                
                let flipped = 1;
                if (!flowerActive && !delayReturning) {
                    if (!data.isExamining || (data.isExamining && Math.abs(vx) > 5)) {
                        if (window.beeMouseX < data.beeX && data.isExamining) flipped = -1; 
                        else if (vx > 0) flipped = -1; 
                    }
                } else if (flowerActive) {
                    flipped = -1; // Face right towards the off-screen flower
                }

                let tilt = (vy * 0.005) * flipped; 
                tilt = Math.max(-0.15, Math.min(0.15, tilt));
                
                // Remove scaleX from container so the speech bubble stays pointing perfectly normal
                data.el.style.transform = `translate(${data.beeX - 60}px, ${data.beeY - 60}px) scale(${data.scaleBounce}) rotate(${tilt}rad)`;
                data.el.style.transition = 'transform 0.1s ease-out, opacity 0.3s ease-out';
                
                // Apply ONLY to the image to flip the bee
                const beeBodyImg = data.el.querySelector('.bee-body');
                if (beeBodyImg) {
                    beeBodyImg.style.transform = `scaleX(${flipped})`;
                }
            });
        });

        // ---- Context-Aware Autonomous Bee Dialogue ----
        setInterval(() => {
            let message = null;
            let timeSpentSeconds = (Date.now() - window.siteStartTime) / 1000;

            if (window.isPlayingBreakout) {
                let msgs = [
                    "Go go go!", "Don't drop it!", "Nice hit!",
                    "Can you beat the high score?", "I could do better...",
                    "Focus!", "Break those bricks!", "Oooh close one!",
                    "You're on fire!", "That was smooth!",
                    "My wings are tired just watching."
                ];
                message = msgs[Math.floor(Math.random() * msgs.length)];
            } else if (window.isAudioPlaying && window.currentAudioTrackName) {
                const trackName = window.currentAudioTrackName.toUpperCase();
                if (trackName.includes("ARIA")) {
                    let msgs = [
                        "I love this song!", "It reminds me of something...",
                        "Minecraft vibes...", "So peaceful.",
                        "This takes me back.", "I could listen forever.",
                        "Building memories...", "The bees approve."
                    ];
                    message = msgs[Math.floor(Math.random() * msgs.length)];
                } else if (trackName.includes("WALTZ")) {
                    let msgs = [
                        "So sad and beautiful...", "A masterpiece...",
                        "Such elegance.", "Dancing in the dark.",
                        "Shostakovich knew pain.", "Hauntingly gorgeous.",
                        "I'm getting emotional.", "Art in its purest form."
                    ];
                    message = msgs[Math.floor(Math.random() * msgs.length)];
                } else if (trackName.includes("MIDNIGHT")) {
                    let msgs = [
                        "Pure nostalgia...", "GTA V memories!",
                        "Midnight drives...", "Classic synthpop!",
                        "City lights and neon.", "I feel alive!",
                        "Turn it up!", "This is a vibe."
                    ];
                    message = msgs[Math.floor(Math.random() * msgs.length)];
                }
            } else if (timeSpentSeconds > 60 && Math.random() > 0.5) {
                let msgs = [
                    "Still here?", "Go touch grass.",
                    "Don't you have work to do?", "Just watching me fly?",
                    "Zzz...", "You must really like this site.",
                    "I'm running out of things to say.",
                    "Hire him already!"
                ];
                message = msgs[Math.floor(Math.random() * msgs.length)];
            }

            if (message && !flowerActive) {
                const randomBee = beeData[Math.floor(Math.random() * beeData.length)];
                randomBee.customMessage = message;
                randomBee.customMessageTime = Date.now();
            }
        }, 3500);
    }

    // ---- 7. Background Floating Icons Random Glow ----
    const floatingIcons = document.querySelectorAll('.floating-icon');
    if (floatingIcons.length > 0 && typeof gsap !== 'undefined') {
        const glowColors = [
            'rgba(255, 255, 255, 0.8)',
            'rgba(105, 240, 174, 0.8)',
            'rgba(200, 182, 255, 0.8)',
            'rgba(255, 181, 167, 0.8)'
        ];

        floatingIcons.forEach(icon => {
            function triggerRandomGlow() {
                // Random duration between 2 and 5 seconds for the slow glow cycle
                const duration = 2 + Math.random() * 3;
                const randomColor = glowColors[Math.floor(Math.random() * glowColors.length)];
                
                // Animate to lit state
                gsap.to(icon, {
                    opacity: 0.8,
                    filter: `drop-shadow(0 0 25px ${randomColor}) brightness(1.5)`,
                    duration: duration / 2,
                    ease: "sine.inOut",
                    onComplete: () => {
                        // Animate back to unlit state
                        gsap.to(icon, {
                            opacity: 0.15,
                            filter: 'drop-shadow(0 0 0px rgba(0,0,0,0)) brightness(1)',
                            duration: duration / 2,
                            ease: "sine.inOut",
                            onComplete: () => {
                                // Wait a random amount of time (1 to 4 seconds) before glowing again
                                setTimeout(triggerRandomGlow, 1000 + Math.random() * 3000);
                            }
                        });
                    }
                });
            }

            // Stagger their initial start times so they don't all glow in uniform at refresh
            setTimeout(triggerRandomGlow, Math.random() * 4000);
        });
    }

    // ---- 8. Interactive Gramophone Logic ----
    const tonearm = document.getElementById('tonearm');
    const vinyl = document.getElementById('active-vinyl');
    const platterBase = document.querySelector('.gramophone-3d-base');
    const gramoStage = document.querySelector('.gramo-stage');
    const wannaListen = document.querySelector('.wanna-listen');
    const recordName = document.getElementById('record-name');
    const nextBtn = document.getElementById('next-record');
    const prevBtn = document.getElementById('prev-record');

    if (tonearm && typeof gsap !== 'undefined' && typeof Draggable !== 'undefined') {
        gsap.registerPlugin(Draggable);

        let isPlaying = false;
        let isReady = false; // Needle on record but not yet 'pressed'
        let currentRecordIndex = 0;
        
        // Global Audio Object
        const audio = new Audio();
        audio.volume = 0.5;

        const records = [
            { 
                name: 'MIDNIGHT CITY', 
                artist: 'M83', 
                color: '#c8b6ff', 
                file: 'asset/audio/Midnight City.mp3' 
            },
            { 
                name: 'ARIA-MATH', 
                artist: 'C418', 
                color: '#ffb5a7', 
                file: 'asset/audio/ARIA-MATH.mp3' 
            },
            { 
                name: 'WALTZ NO. 2', 
                artist: 'SHOSTAKOVICH', 
                color: '#c1d3fe', 
                file: 'asset/audio/Waltz No. 2.mp3' 
            }
        ];

        // Interaction Hint - Inject safely
        const vinylHint = document.createElement('div');
        vinylHint.className = 'vinyl-play-hint';
        vinylHint.innerText = 'Click to Play';
        if (platterBase) platterBase.appendChild(vinylHint);

        // Premium 3D Mouse Tilt
        const wrap = document.querySelector('.gramophone-wrap');
        platterBase.addEventListener('mousemove', (e) => {
            const rect = platterBase.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            gsap.to(wrap, {
                rotateY: x * 15,
                rotateX: -y * 15 + 10,
                duration: 0.5,
                ease: "power2.out"
            });
        });

        platterBase.addEventListener('mouseleave', () => {
            gsap.to(wrap, {
                rotateY: -8,
                rotateX: 15,
                duration: 1,
                ease: "power2.out"
            });
            gsap.to(tonearm, { rotation: 150, duration: 0.5 });
        });

        platterBase.addEventListener('mouseenter', () => {
            if (!isPlaying && !isReady) {
                gsap.to(tonearm, { 
                    rotation: 145, 
                    duration: 0.15, 
                    yoyo: true, 
                    repeat: 3, 
                    ease: "sine.inOut" 
                });
            }
        });

        // Tonearm Draggable logic
        Draggable.create(tonearm, {
            type: "rotation",
            bounds: { minRotation: 40, maxRotation: 180 },
            onDrag: function() {
                checkReadyState(this.rotation);
            },
            onThrowUpdate: function() {
                checkReadyState(this.rotation);
            },
            inertia: true,
            snap: function(endValue) {
                // If close to 'ready' (over the CD), snap to play position
                if (endValue >= 110) return 140;
                // Otherwise snap back to rest corner
                return 60;
            },
            onRelease: function() {
                checkReadyState(this.rotation);
            }
        });

        function checkReadyState(rot) {
            // High-fidelity alignment: 110-180deg is the "active" zone over the platter
            if (rot >= 110) {
                if (!isReady) {
                    isReady = true;
                    if (platterBase) platterBase.classList.add('active-drop-glow');
                    const neoring = document.querySelector('.neoring');
                    if (neoring) gsap.to(neoring, { opacity: 0.8, duration: 0.3, scale: 1.05 });
                    if (vinyl) vinyl.style.cursor = 'pointer';
                    
                    // Update Hints
                    if (wannaListen) wannaListen.innerText = "CLICK ON CD";
                    if (vinylHint) {
                        gsap.to(vinylHint, { opacity: 1, duration: 0.3 });
                        vinylHint.innerText = 'PLAY';
                    }
                }
            } else {
                if (isReady || isPlaying) {
                    if (isPlaying) stopPlayback();
                    isReady = false;
                    if (platterBase) platterBase.classList.remove('active-drop-glow');
                    const neoring = document.querySelector('.neoring');
                    if (neoring) gsap.to(neoring, { opacity: 0.1, duration: 0.3, scale: 1 });
                    if (vinyl) vinyl.style.cursor = 'default';
                    
                    // Reset Hints
                    if (wannaListen) wannaListen.innerText = "Wanna listen?? put the pin";
                    if (vinylHint) gsap.to(vinylHint, { opacity: 0, duration: 0.3 });
                }
            }
        }

        // The "Press to Start" interaction
        vinyl.addEventListener('click', () => {
            if (isReady && !isPlaying) {
                startPlayback();
            } else if (isPlaying) {
                stopPlayback();
            }
        });

        function startPlayback() {
            if (isPlaying) return;
            
            isPlaying = true;
            window.isAudioPlaying = true;
            window.currentAudioTrackName = records[currentRecordIndex].name;
            
            if (platterBase) platterBase.classList.add('is-spinning');
            if (gramoStage) gramoStage.classList.add('playback-active');
            
            // Set source and play
            audio.src = records[currentRecordIndex].file;
            
            audio.play()
                .then(() => {
                    console.log("Gramophone: Playing " + records[currentRecordIndex].name);
                    gsap.to('.vinyl-play-hint', { opacity: 0, duration: 0.3 });
                })
                .catch(e => {
                    console.error("Gramophone: Error", e);
                    // Visual error feedback
                    isPlaying = false;
                    platterBase.classList.remove('is-spinning');
                    vinylHint.innerText = 'File Not Found';
                    gsap.to('.vinyl-play-hint', { opacity: 1, duration: 0.3 });
                });
            
            gsap.to(vinyl, { scale: 0.98, duration: 0.1, yoyo: true, repeat: 1 });
        }

        function stopPlayback() {
            if (!isPlaying) return;
            
            isPlaying = false;
            window.isAudioPlaying = false;
            if (platterBase) platterBase.classList.remove('is-spinning');
            if (gramoStage) gramoStage.classList.remove('playback-active');
            
            audio.pause();
            
            if (vinylHint) {
                vinylHint.innerText = 'PLAY';
                if (isReady) gsap.to(vinylHint, { opacity: 1, duration: 0.3 });
            }
        }

        // Record Switching Logic
        function updateRecord(index) {
            currentRecordIndex = index;
            const data = records[index];

            // Preload the audio file
            audio.src = data.file;
            audio.load();

            // Start playing new track immediately if already playing
            if (isPlaying) {
                // Slight delay to simulate needle drop reset
                setTimeout(() => {
                    audio.src = data.file;
                    window.currentAudioTrackName = data.name;
                    audio.play().catch(e => console.error("Auto-play blocked", e));
                }, 400);
            }

            // Animate local UI
            const label = document.querySelector('.vinyl-label');
            if (label) {
                gsap.to(label, {
                    backgroundColor: data.color,
                    duration: 0.4,
                    ease: "power2.out"
                });
            }
            
            if (recordName) recordName.innerText = data.name + ".BIN";
            // Update subtitle to show artist
            const subtitle = document.querySelector('.vinyl-title');
            if (subtitle) subtitle.innerText = data.artist || "SYSTEM PLAYBACK";

            // Update neon colors & dynamic ambient glow
            document.documentElement.style.setProperty('--accent-3', data.color);
            document.documentElement.style.setProperty('--ambient-glow', data.color);

            // Update vinyl border color to match song
            if (vinyl) vinyl.style.borderColor = data.color;
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const nextIndex = (currentRecordIndex + 1) % records.length;
                
                gsap.to(vinyl, {
                    rotate: 20,
                    x: 150,
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.in",
                    onComplete: () => {
                        if (isPlaying) stopPlayback();
                        updateRecord(nextIndex);
                        gsap.fromTo(vinyl, { x: -150, rotate: -20, opacity: 0 }, { x: 0, rotate: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
                    }
                });
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const prevIndex = (currentRecordIndex - 1 + records.length) % records.length;
                
                gsap.to(vinyl, {
                    rotate: -20,
                    x: -150,
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.in",
                    onComplete: () => {
                        if (isPlaying) stopPlayback();
                        updateRecord(prevIndex);
                        gsap.fromTo(vinyl, { x: 150, rotate: 20, opacity: 0 }, { x: 0, rotate: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
                    }
                });
            });
        }
    }


});


// ---- 7. Project Journey Refined Logic (ScrollTrigger Pinning & Scaling) ----
function initProjectJourney() {
    const section = document.querySelector('.projects-journey');
    const container = document.querySelector('.journey-pin-wrapper');
    const progressBar = document.querySelector('.neon-progress-bar');
    const slides = gsap.utils.toArray('.j-slide');
    const navItems = gsap.utils.toArray('.j-nav-item');

    if (!section || !container || slides.length === 0) return;

    // Create the pinned scrub timeline
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "center center", // Centers perfectly since section is exactly 100vh
            end: "+=3000", // Slightly longer scroll duration
            pin: true, // Pin the ENTIRE section to prevent next-section overlap
            scrub: 1, // Smooth scrub
            anticipatePin: 1, // Helps prevent snapping on entry
            onUpdate: (self) => {
                // Active dot perfectly syncs with the physical neon line
                // Base timeline is 2.0s, Buffer is 0.5s. Total = 2.5s.
                // 100% line happens at 2.0 / 2.5 = 0.8 progress.
                // 50% line happens at 1.0 / 2.5 = 0.4 progress.
                let activeIndex = 0;
                if (self.progress >= 0.8) {
                    activeIndex = 2; // Reach 3rd dot exactly at end of line drawing
                } else if (self.progress >= 0.4) {
                    activeIndex = 1; // Reach 2nd dot when line is 50%
                }
                
                navItems.forEach((item, idx) => {
                    // Keep the dot active if the line has passed it (idx <= activeIndex)
                    item.classList.toggle('active', idx <= activeIndex);
                });
            }
        }
    });

    // 1. Neon progress bar fills from 0 to 100% over the whole timeline
    tl.to(progressBar, {
        height: "100%",
        ease: "none",
        duration: slides.length - 1
    }, 0);

    // 2. Crossfade Slide transitions
    slides.forEach((slide, i) => {
        // Initial setup to ensure consistency
        if (i === 0) {
            gsap.set(slide, { zIndex: 10, pointerEvents: "auto", opacity: 1, autoAlpha: 1 });
        } else {
            gsap.set(slide, { zIndex: 1, pointerEvents: "none", opacity: 0, autoAlpha: 0 });
        }

        if (i !== 0) {
            const prevSlide = slides[i - 1];
            
            // Fade out old slide (drifting up slightly)
            // Starts halfway through the scroll distance to the next project
            tl.to(prevSlide, {
                opacity: 0,
                autoAlpha: 0,
                y: -40,
                zIndex: 1,
                pointerEvents: "none",
                duration: 0.5,
                ease: "power2.inOut"
            }, i - 0.5);
            
            // Fade in new slide (drifting up into place)
            // Starts halfway through the scroll distance to the next project
            tl.fromTo(slide, 
                { opacity: 0, autoAlpha: 0, y: 40, zIndex: 1, pointerEvents: "none" },
                { 
                    opacity: 1, 
                    autoAlpha: 1, 
                    y: 0, 
                    zIndex: 10, 
                    pointerEvents: "auto", 
                    duration: 0.5, 
                    ease: "power2.inOut" 
                },
                i - 0.5 // Reveal exactly between current dot and next dot
            );
        }
    });

    // 3. Add click listeners for navigation items to scroll to slide
    navItems.forEach((item, i) => {
        item.addEventListener('click', () => {
            const start = tl.scrollTrigger.start;
            const end = tl.scrollTrigger.end;
            const total = end - start;
            // Calculate progress for slide i. Slides start at 0 and end at duration slides.length-1
            // Adding a tiny offset to ensure we land inside the reveal zone
            const progress = i / (slides.length - 1);
            const scrollTo = start + (total * progress);
            
            gsap.to(window, {
                scrollTo: scrollTo,
                duration: 1.2,
                ease: "power2.inOut"
            });
        });
        
        // Horizontal hover effect on title
        item.style.cursor = 'pointer';
    });

    // 4. Add a small buffer at the end so scrub has time to catch up before unpinning
    tl.to({}, { duration: 0.5 });
}

// Call the init function
initProjectJourney();

// ---- 9. Project Details Toggle Logic ----
function initProjectDetailsToggle() {
    const detailButtons = document.querySelectorAll('.more-details-btn');
    
    detailButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid triggering any other scroll events if necessary
            const slide = btn.closest('.j-slide');
            if (slide) {
                const isExpanded = slide.classList.toggle('is-expanded');
                
                // Update button text while preserving the icon
                const textNode = btn.querySelector('span');
                if (textNode) {
                    textNode.textContent = isExpanded ? " Less Details " : " More Details ";
                }
            }
        });
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initProjectDetailsToggle();

    // ---- Certificate Lightbox ----
    const certLightbox = document.getElementById('cert-lightbox');
    const certIframe = document.getElementById('cert-lightbox-iframe');
    const certCloseBtn = document.getElementById('cert-lightbox-close');
    const certCards = document.querySelectorAll('.cert-card');

    function openCertLightbox(pdfUrl) {
        if (!certLightbox || !certIframe) return;
        certIframe.src = pdfUrl;
        certLightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCertLightbox() {
        if (!certLightbox || !certIframe) return;
        certLightbox.classList.remove('active');
        document.body.style.overflow = '';
        // Delay clearing src to let fade-out finish
        setTimeout(() => { certIframe.src = ''; }, 400);
    }

    certCards.forEach(card => {
        card.addEventListener('click', () => {
            const pdfUrl = card.getAttribute('data-pdf');
            if (pdfUrl) openCertLightbox(pdfUrl);
        });
    });

    if (certCloseBtn) {
        certCloseBtn.addEventListener('click', closeCertLightbox);
    }

    if (certLightbox) {
        certLightbox.addEventListener('click', (e) => {
            if (e.target === certLightbox) closeCertLightbox();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && certLightbox?.classList.contains('active')) {
            closeCertLightbox();
        }
    });
});
