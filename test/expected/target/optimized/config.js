var rootDir = Array(document.location.href.split(/[/\\]/).filter(function(e, i){return (('currentScript' in document) ? document.currentScript : document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1]).src.split(/[/\\]/)[i] !== e;}).length).join('../');
window.require = window.require || {};
window.require.baseUrl = rootDir + 'target/compiled';
window.require.packages = (window.require.packages || []).concat(["application"]);
