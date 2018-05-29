if (navigator['serviceWorker']) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function (registration) {
        console.log('Service worker successfully registered on scope', registration.scope);

    }).catch(function (error) {
        console.log('Service worker failed to register');
    });
}