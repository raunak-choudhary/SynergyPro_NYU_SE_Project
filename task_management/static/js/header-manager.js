document.addEventListener('DOMContentLoaded', function() {
    // Profile Dropdown initialization
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownMenu = profileDropdown?.querySelector('.profile-dropdown-menu');

    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleProfileMenu();
        });

        // Profile link handling
        const profileLink = dropdownMenu?.querySelector('a[href*="profile"]');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                const profileUrl = profileLink.getAttribute('href');
                if (profileUrl) {
                    window.location.href = profileUrl;
                }
            });
        }
    }

    function toggleProfileMenu() {
        if (dropdownMenu) {
            const isShowing = dropdownMenu.classList.contains('show');
            document.querySelectorAll('.profile-dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
            if (!isShowing) {
                dropdownMenu.classList.add('show');
            }
        }
    }

    // Global click handler for dropdowns
    document.addEventListener('click', (e) => {
        // Close profile dropdown
        if (!e.target.closest('#profileDropdown') && dropdownMenu?.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });
});
