function LoadNavbar() {
    const Navbar = document.getElementById('navbar')
    Navbar.innerHTML = `
    <ul>
        <li><a href="/" aria-label="Home">Home</a></li>
        <li><a href="#" aria-label="Calculator">Calculator</a></li>
        <li><a href="#" aria-label="Value Changes">Value Changes</a></li>
        <li><a href="#" aria-label="Collectibles">Collectibles</a></li>
    </ul>
    `
    Array.from(Navbar.children[0].children).forEach(item => {
        item = item.children[0]
        console.log(window.location.pathname, item.getAttribute('href'))
        if (window.location.pathname === item.getAttribute('href')) {
            item.classList.add('active')
        } else {
            item.classList.remove('active')
        }
    })
}

LoadNavbar()