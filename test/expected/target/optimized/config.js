var rootDir = Array(document.location.href.split(/[/\\]/).filter(function(e, i){return document.currentScript.src.split(/[/\\]/)[i] !== e;}).length).join('../');
window.require = window.require || {};
window.require.baseUrl = rootDir + 'target/compiled';
window.require.packages = (window.require.packages || []).concat(["application"]);
