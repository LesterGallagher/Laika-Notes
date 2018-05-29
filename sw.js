var CACHE_NAME = 'static-cache';
var urlsToCache = [
    '.',
    './index.html',
    './lib/OnsenUI/css/onsenui.css',
    './lib/OnsenUI/css/onsen-css-components.css',
    './lib/OnsenUI/css/onsen-css-components-dark-theme.css',
    './lib/quill/quill.snow.css',
    './lib/angular/angular.min.js',
    './cordova.js',
    './lib/quill/quill.min.js',
    './js/index.js',
    './lib/OnsenUI/css/font_awesome/css/font-awesome.min.css',
    './lib/OnsenUI/css/ionicons/css/ionicons.min.css',
    './views/main.html',
    './views/note.html',
    './plugins/cordova-plugin-admobpro/www/AdMob.js',
    './plugins/cordova-plugin-device/www/device.js',
    './plugins/cordova-plugin-dialogs/www/notification.js',
    './plugins/cordova-plugin-dialogs/www/browser/notification.js',
    './js/browser.js',
];


self.addEventListener('install', function(event) {
    console.log('Installed sw.js', event);
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    )
});

self.addEventListener('activate', function(event) {
    console.log('Activated sw.js', event);
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
            return response || fetch(event.request)
        })
    )
});