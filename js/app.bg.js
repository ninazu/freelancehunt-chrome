/*
	FH_COM_JS v3.0 alpha
	(c) 2014-2015 by Vaskevych. All rights reserved.
	http://freelancehunt.com/freelancer/Vaskevych.html
*/

let api_prj  = "https://api.freelancehunt.com/v2/projects",
	api_feed = "https://api.freelancehunt.com/v2/my/feed",
	api_mess = "https://api.freelancehunt.com/v2/threads",
	api_prof = "https://api.freelancehunt.com/v2/my/profile",
	api_skil = "https://api.freelancehunt.com/v2/skills";
	
$(document).ready(function() {
	
function GetSkillsUrl(){
	if (localStorage.getItem('ME_SKL') == null) {
		return api_prj;
	} else {
		if ( localStorage.getItem('ME_SKL').length == 0) {
			return api_prj;
		} else {
			return api_prj + '?skills=' + localStorage.getItem('ME_SKL').slice(0, -1);
		}
	}
}

chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){

	if(message.method == "UpdateCount"){
		$.UpdateCount();
	
		return true;
	}
	
	if(message.method == "Update"){
	
		$.GetData(api_skil, 'SKL');
		$.GetData(api_feed, 'FEED');
		$.GetData(api_prof, 'PROFILE');
		$.GetDataVal(GetSkillsUrl(), 'DB');
		$.GetData(api_mess, 'MS');
		
		$.UpdateCount();
	
	return true;
	}
	
	if(message.method == "ELoading"){
		$.UpdateCount();
		return true;
	}
	
});

// 1 minutes interval
setInterval(function() { 
	chrome.runtime.sendMessage({method:"Update"}, null);
}, 60000);

// First Run App
chrome.runtime.sendMessage({method:"Update"}, null);

});