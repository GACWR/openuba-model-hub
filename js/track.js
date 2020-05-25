
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-112714888-4', 'auto');
ga('send', 'pageview');

$(".nav-link").click((function(obj){
	var topic = obj.currentTarget.href
	ga('send', 'event', {
	  'eventCategory': 'Nav-Link Pressed: '+topic,
	  'eventAction': 'Action'
	});
}))


$(".portfolio-box").click((function(obj){
	ga('send', 'event', {
	  'eventCategory': 'Create Campaign: ',
	  'eventAction': 'clicked',
	  'eventLabel': 'portfolio'
	});
}))

$(".twbtn").click((function(obj){
	ga('send', 'event', {
	  'eventCategory': 'twitter button clicked',
	  'eventAction': 'clicked',
	  'eventLabel': 'tw'
	});
}))


$(".dbtn").click((function(obj){
	ga('send', 'event', {
	  'eventCategory': 'discord button clicked',
	  'eventAction': 'clicked',
	  'eventLabel': 'd'
	});
}))


$(".ghbtn").click((function(obj){
	ga('send', 'event', {
	  'eventCategory': 'github button clicked',
	  'eventAction': 'clicked',
	  'eventLabel': 'gh'
	});
}))


$(".whitepaperbtn").click((function(obj){
	ga('send', 'event', {
	  'eventCategory': 'white paper button clicked',
	  'eventAction': 'clicked',
	  'eventLabel': 'wp'
	});
}))


$(".repobtn").click((function(obj){
	ga('send', 'event', {
	  'eventCategory': 'github repo button clicked',
	  'eventAction': 'clicked',
	  'eventLabel': 'repo'
	});
}))
