(function () {
    console.log("--- CLICK INTERCEPTION DEBUGGER STARTED ---");

    // 1. Listen for ALL clicks on the document
    document.addEventListener('click', function (e) {
        console.log("Global Click Detected on:", e.target);
        console.log("Target Classes:", e.target.className);
        console.log("Target ID:", e.target.id);

        // Check if we clicked something that SHOULD work
        if (e.target.matches('button') || e.target.closest('button')) {
            alert("GLOBAL DEBUG: You clicked a button!\nTarget: " + (e.target.innerText || e.target.className));
        } else {
            // Optional: Alert on empty space clicks if desperate
            // alert("Clicked non-button: " + e.target.tagName);
        }
    }, true); // Use capture phase to ensure we catch it before anyone stops propagation

    // 2. Check Z-Index of Navbar
    const nav = document.querySelector('.navbar');
    if (nav) {
        const style = window.getComputedStyle(nav);
        console.log("Navbar Z-Index:", style.zIndex);
        console.log("Navbar Position:", style.position);
    }

    // 3. Check for specific buttons
    const loginBtn = document.querySelector('button[onclick*="showLoginModal"]');
    if (loginBtn) {
        loginBtn.style.border = "5px solid red"; // VISUALLY HIGHLIGHT THE BUTTON
        console.log("Login Button found and highlighted");
    } else {
        console.error("Login Button NOT found via selector");
    }

})();
