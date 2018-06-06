
var DYNAMIC_CACHE = 'dynamic-cache-v1';
var STATIC_CACHE = 'static-cache-v1'

// listen for outgoing network request
self.addEventListener('fetch', (event) => {
    // try to find response object in the cache
    // associated with current request
    event.respondWith(
        caches.open(STATIC_CACHE).then(function (cache) {
            return cache.match(event.request).then(function (response) {
                console.log('cache response', response);
                if (response) return response;

                return fetch(event.request).then(function (networkResponse) {
                    console.log('no static cache get network', networkResponse);
                    if (!networkResponse || (networkResponse.status !== 200 && !networkResponse.ok)) {
                        return caches.open(DYNAMIC_CACHE).then(function (dynCache) {
                            return dynCache.match(event.request);
                        }).then(function (dynResponse) {
                            console.log('got dynamic cache response', dynResponse);
                            if (dynResponse) return dynResponse;
                            else return networkResponse;
                        });
                    }
                    var cachedResponse = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then(function (dynCache) {
                        console.log('succesfull network request putting in dynamic cache');
                        dynCache.put(event.request, cachedResponse);
                    });
                    return networkResponse;
                });
            });
        })
    );
});

self.addEventListener('activate', function (event) {
    console.log('service worker activate');
});

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(function (cache) {
            return cache.addAll(
                [
                    "./",
                    "./lib/OnsenUI/css/onsen-css-components.css",
                    "./lib/OnsenUI/css/onsen-css-components-dark-theme.css",
                    "./lib/OnsenUI/css/font_awesome/css/font-awesome.min.css",
                    "./lib/angular/angular.min.js",
                    "./lib/OnsenUI/js/onsenui.min.js",
                    "./cordova.js",
                    "./lib/quill/quill.min.js",
                    "./js/promise-polyfill.min.js",
                    "./js/index.js",
                    "./lib/OnsenUI/css/onsenui.css",
                    "./lib/quill/quill.snow.css",
                    "./lib/OnsenUI/css/ionicons/css/ionicons.min.css",
                    "./cordova_plugins.js",
                    "./plugins/cordova-plugin-admobpro/www/AdMob.js",
                    "./plugins/cordova-plugin-device/www/device.js",
                    "./plugins/cordova-plugin-device/src/browser/DeviceProxy.js",
                    "./plugins/cordova-plugin-dialogs/www/notification.js",
                    "./plugins/cordova-plugin-dialogs/www/browser/notification.js",
                    "./plugins/cordova-plugin-file/www/DirectoryEntry.js",
                    "./plugins/cordova-plugin-file/www/DirectoryReader.js",
                    "./plugins/cordova-plugin-file/www/Entry.js",
                    "./plugins/cordova-plugin-file/www/File.js",
                    "./plugins/cordova-plugin-file/www/FileEntry.js",
                    "./plugins/cordova-plugin-file/www/FileError.js",
                    "./plugins/cordova-plugin-file/www/FileReader.js",
                    "./plugins/cordova-plugin-file/www/FileSystem.js",
                    "./plugins/cordova-plugin-file/www/FileUploadOptions.js",
                    "./plugins/cordova-plugin-file/www/FileUploadResult.js",
                    "./plugins/cordova-plugin-file/www/FileWriter.js",
                    "./plugins/cordova-plugin-file/www/Flags.js",
                    "./plugins/cordova-plugin-file/www/LocalFileSystem.js",
                    "./plugins/cordova-plugin-file/www/Metadata.js",
                    "./plugins/cordova-plugin-file/www/ProgressEvent.js",
                    "./plugins/cordova-plugin-file/www/fileSystems.js",
                    "./plugins/cordova-plugin-file/www/requestFileSystem.js",
                    "./plugins/cordova-plugin-file/www/resolveLocalFileSystemURI.js",
                    "./plugins/cordova-plugin-file/www/browser/isChrome.js",
                    "./plugins/cordova-plugin-file/www/browser/Preparing.js",
                    "./plugins/cordova-plugin-file/src/browser/FileProxy.js",
                    "./plugins/cordova-plugin-file/www/fileSystemPaths.js",
                    "./plugins/cordova-plugin-file/www/browser/FileSystem.js",
                    "./plugins/cordova-plugin-media-capture/www/CaptureAudioOptions.js",
                    "./plugins/cordova-plugin-media-capture/www/CaptureImageOptions.js",
                    "./plugins/cordova-plugin-media-capture/www/CaptureVideoOptions.js",
                    "./plugins/cordova-plugin-media-capture/www/CaptureError.js",
                    "./plugins/cordova-plugin-media-capture/www/MediaFileData.js",
                    "./plugins/cordova-plugin-media-capture/www/MediaFile.js",
                    "./plugins/cordova-plugin-media-capture/www/helpers.js",
                    "./plugins/cordova-plugin-media-capture/www/capture.js",
                    "./plugins/cordova-plugin-media-capture/src/browser/CaptureProxy.js",
                    "./manifest.json",
                    "./android-chrome-192x192.png",
                    "./views/main.html",
                    "./js/browser.js",
                    "./lib/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.woff?v=4.1.0"
                ]
            );
        })
    );
});


