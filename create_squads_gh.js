let squads = Array.from({ length: 12 }, (_, i) => i)

squads.forEach( (squad) => {
    const newWindow = window.open(url, '_blank')
    newWindow.addEventListener('DOMContentLoaded', () => {
        newWindow.document.querySelector('#team-name').value = `Squad ${squad+1}`
        let btn = newWindow.document.querySelector('.js-create-team-button')
        btn.disabled = false
        btn.click()
    })
})