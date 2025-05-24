/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/services/background.ts":
/*!************************************!*\
  !*** ./src/services/background.ts ***!
  \************************************/
/***/ (function() {


var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Background script for Lens for Google Calendar
var DEBUG_MODE = "development" !== 'production';
function log(level, message) {
    var data = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        data[_i - 2] = arguments[_i];
    }
    var prefix = '[Lens for Google Calendar Background]';
    switch (level) {
        case 'warn':
            console.warn.apply(console, __spreadArray(["".concat(prefix, " ").concat(message)], data, false));
            break;
        case 'error':
            console.error.apply(console, __spreadArray(["".concat(prefix, " ").concat(message)], data, false));
            break;
        default:
            console.log.apply(console, __spreadArray(["".concat(prefix, " ").concat(message)], data, false));
    }
}
log('log', 'Background script loaded');
// Keep track of which tabs have the extension loaded
var activeTabsMap = new Map();
// Chrome runtime onInstalled listener
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        log('log', 'Extension installed');
    }
    else if (details.reason === 'update') {
        var thisVersion = chrome.runtime.getManifest().version;
        log('log', "Extension updated to version ".concat(thisVersion));
    }
});
// Listen for tab updates to reset injected state when navigating
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.status === 'loading') {
        // Tab is navigating, reset the injection state
        activeTabsMap.delete(tabId);
    }
});
// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    var _a;
    try {
        var tabId = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id;
        log('log', 'Received message:', message, 'from tab:', tabId);
        // Handle different action types
        switch (message.action) {
            case 'contentScriptLoaded': {
                // Content script is letting us know it's loaded
                if (tabId) {
                    activeTabsMap.set(tabId, true);
                    log('log', "Content script loaded in tab ".concat(tabId));
                }
                sendResponse({
                    status: 'acknowledged',
                    timestamp: Date.now(),
                    debug: DEBUG_MODE
                });
                break;
            }
            case 'openOptions': {
                // Request to open options page
                chrome.runtime.openOptionsPage();
                sendResponse({ status: 'success', action: 'openedOptions' });
                break;
            }
            default: {
                // Default response for compatibility with existing code
                sendResponse({ status: 'received', message: 'Unknown action type' });
            }
        }
    }
    catch (error) {
        log('error', 'Error handling message', error);
        // Send error response
        sendResponse({ status: 'error', error: String(error) });
    }
    // Return true to indicate we will send a response asynchronously
    return true;
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/services/background.ts"]();
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQWE7QUFDYjtBQUNBLDZFQUE2RSxPQUFPO0FBQ3BGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsYUFBb0I7QUFDckM7QUFDQTtBQUNBLHFCQUFxQix1QkFBdUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsNENBQTRDO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLG9EQUFvRDtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsdUNBQXVDO0FBQzlEO0FBQ0E7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7O1VFekZEO1VBQ0E7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9sZW5zLWZvci1nb29nbGUtY2FsZW5kYXIvLi9zcmMvc2VydmljZXMvYmFja2dyb3VuZC50cyIsIndlYnBhY2s6Ly9sZW5zLWZvci1nb29nbGUtY2FsZW5kYXIvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9sZW5zLWZvci1nb29nbGUtY2FsZW5kYXIvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2xlbnMtZm9yLWdvb2dsZS1jYWxlbmRhci93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19zcHJlYWRBcnJheSA9ICh0aGlzICYmIHRoaXMuX19zcHJlYWRBcnJheSkgfHwgZnVuY3Rpb24gKHRvLCBmcm9tLCBwYWNrKSB7XG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKGFyIHx8ICEoaSBpbiBmcm9tKSkge1xuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20pKTtcbn07XG4vLyBCYWNrZ3JvdW5kIHNjcmlwdCBmb3IgTGVucyBmb3IgR29vZ2xlIENhbGVuZGFyXG52YXIgREVCVUdfTU9ERSA9IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbic7XG5mdW5jdGlvbiBsb2cobGV2ZWwsIG1lc3NhZ2UpIHtcbiAgICB2YXIgZGF0YSA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGRhdGFbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIHZhciBwcmVmaXggPSAnW0xlbnMgZm9yIEdvb2dsZSBDYWxlbmRhciBCYWNrZ3JvdW5kXSc7XG4gICAgc3dpdGNoIChsZXZlbCkge1xuICAgICAgICBjYXNlICd3YXJuJzpcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybi5hcHBseShjb25zb2xlLCBfX3NwcmVhZEFycmF5KFtcIlwiLmNvbmNhdChwcmVmaXgsIFwiIFwiKS5jb25jYXQobWVzc2FnZSldLCBkYXRhLCBmYWxzZSkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkoY29uc29sZSwgX19zcHJlYWRBcnJheShbXCJcIi5jb25jYXQocHJlZml4LCBcIiBcIikuY29uY2F0KG1lc3NhZ2UpXSwgZGF0YSwgZmFsc2UpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgX19zcHJlYWRBcnJheShbXCJcIi5jb25jYXQocHJlZml4LCBcIiBcIikuY29uY2F0KG1lc3NhZ2UpXSwgZGF0YSwgZmFsc2UpKTtcbiAgICB9XG59XG5sb2coJ2xvZycsICdCYWNrZ3JvdW5kIHNjcmlwdCBsb2FkZWQnKTtcbi8vIEtlZXAgdHJhY2sgb2Ygd2hpY2ggdGFicyBoYXZlIHRoZSBleHRlbnNpb24gbG9hZGVkXG52YXIgYWN0aXZlVGFic01hcCA9IG5ldyBNYXAoKTtcbi8vIENocm9tZSBydW50aW1lIG9uSW5zdGFsbGVkIGxpc3RlbmVyXG5jaHJvbWUucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihmdW5jdGlvbiAoZGV0YWlscykge1xuICAgIGlmIChkZXRhaWxzLnJlYXNvbiA9PT0gJ2luc3RhbGwnKSB7XG4gICAgICAgIGxvZygnbG9nJywgJ0V4dGVuc2lvbiBpbnN0YWxsZWQnKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZGV0YWlscy5yZWFzb24gPT09ICd1cGRhdGUnKSB7XG4gICAgICAgIHZhciB0aGlzVmVyc2lvbiA9IGNocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KCkudmVyc2lvbjtcbiAgICAgICAgbG9nKCdsb2cnLCBcIkV4dGVuc2lvbiB1cGRhdGVkIHRvIHZlcnNpb24gXCIuY29uY2F0KHRoaXNWZXJzaW9uKSk7XG4gICAgfVxufSk7XG4vLyBMaXN0ZW4gZm9yIHRhYiB1cGRhdGVzIHRvIHJlc2V0IGluamVjdGVkIHN0YXRlIHdoZW4gbmF2aWdhdGluZ1xuY2hyb21lLnRhYnMub25VcGRhdGVkLmFkZExpc3RlbmVyKGZ1bmN0aW9uICh0YWJJZCwgY2hhbmdlSW5mbykge1xuICAgIGlmIChjaGFuZ2VJbmZvLnN0YXR1cyA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgIC8vIFRhYiBpcyBuYXZpZ2F0aW5nLCByZXNldCB0aGUgaW5qZWN0aW9uIHN0YXRlXG4gICAgICAgIGFjdGl2ZVRhYnNNYXAuZGVsZXRlKHRhYklkKTtcbiAgICB9XG59KTtcbi8vIExpc3RlbiBmb3IgbWVzc2FnZXMgZnJvbSBjb250ZW50IHNjcmlwdHMgb3IgcG9wdXBcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihmdW5jdGlvbiAobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcbiAgICB2YXIgX2E7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHRhYklkID0gKF9hID0gc2VuZGVyLnRhYikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmlkO1xuICAgICAgICBsb2coJ2xvZycsICdSZWNlaXZlZCBtZXNzYWdlOicsIG1lc3NhZ2UsICdmcm9tIHRhYjonLCB0YWJJZCk7XG4gICAgICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgYWN0aW9uIHR5cGVzXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2NvbnRlbnRTY3JpcHRMb2FkZWQnOiB7XG4gICAgICAgICAgICAgICAgLy8gQ29udGVudCBzY3JpcHQgaXMgbGV0dGluZyB1cyBrbm93IGl0J3MgbG9hZGVkXG4gICAgICAgICAgICAgICAgaWYgKHRhYklkKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZVRhYnNNYXAuc2V0KHRhYklkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nKCdsb2cnLCBcIkNvbnRlbnQgc2NyaXB0IGxvYWRlZCBpbiB0YWIgXCIuY29uY2F0KHRhYklkKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2Fja25vd2xlZGdlZCcsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgZGVidWc6IERFQlVHX01PREVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ29wZW5PcHRpb25zJzoge1xuICAgICAgICAgICAgICAgIC8vIFJlcXVlc3QgdG8gb3BlbiBvcHRpb25zIHBhZ2VcbiAgICAgICAgICAgICAgICBjaHJvbWUucnVudGltZS5vcGVuT3B0aW9uc1BhZ2UoKTtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdGF0dXM6ICdzdWNjZXNzJywgYWN0aW9uOiAnb3BlbmVkT3B0aW9ucycgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgLy8gRGVmYXVsdCByZXNwb25zZSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIGV4aXN0aW5nIGNvZGVcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdGF0dXM6ICdyZWNlaXZlZCcsIG1lc3NhZ2U6ICdVbmtub3duIGFjdGlvbiB0eXBlJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nKCdlcnJvcicsICdFcnJvciBoYW5kbGluZyBtZXNzYWdlJywgZXJyb3IpO1xuICAgICAgICAvLyBTZW5kIGVycm9yIHJlc3BvbnNlXG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN0YXR1czogJ2Vycm9yJywgZXJyb3I6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgfVxuICAgIC8vIFJldHVybiB0cnVlIHRvIGluZGljYXRlIHdlIHdpbGwgc2VuZCBhIHJlc3BvbnNlIGFzeW5jaHJvbm91c2x5XG4gICAgcmV0dXJuIHRydWU7XG59KTtcbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0ge307XG5fX3dlYnBhY2tfbW9kdWxlc19fW1wiLi9zcmMvc2VydmljZXMvYmFja2dyb3VuZC50c1wiXSgpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9