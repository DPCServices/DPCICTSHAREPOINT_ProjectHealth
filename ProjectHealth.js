<!-- LOAD JQUERY -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js"></script>

<!-- AND JQUERY UI -->
<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/themes/smoothness/jquery-ui.css">
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>

<!-- LOAD GOOGLE VISUALISATION API -->
<script type='text/javascript' src='https://www.google.com/jsapi'></script>

<!-- LOAD MINUTE.JS - DATE MANIPULATION -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.12.0/moment.js"></script>
<script>
var dataModel = new Array();
$(function(){
	var prRootListURI = [
		"http://", 							// Protocol
		"teams.gsg.sa.gov.au",				// SP web
		"/ict/be/bussol/Projects/",			// Path to team site
		"_api/Web/Lists/GetByTitle('ICT Project Dashboard')/items" 	// API call for list items
		].join("");
		makeDataModel(prRootListURI);

});


//    +++  A J A X   &   D A T A   M O D E L   F U N C T I O N S +++

/**
	* Builds the data model
	*
	* @param {int} ptr - project index in datamodel
	*/
function getHighlightReports(ptr){
	var project = dataModel[ptr];
	$.ajax({
		url:project.url,
		headers:{"Accept": "application/json;odata=verbose"}
	}).done(function(data){
		var rptData = data.d.results;
		var reportCount = rptData.length-1;
		if (reportCount == -1) {return;} // Bomb out if no records
		
		$(rptData).each(function(i){
			var cRpt = this;
			var report = new Report(
				retValidStr(cRpt.Stage),
				retValidNo(cRpt.Percent),
				retValidStr(cRpt.Pr_Health),
				cRpt.End_x0020_Date,
				cRpt.Forcast_x0020_End_x0020_Date,
				cRpt.Start_x0020_Date,
				retValidStr(cRpt.Executive_x0020_Summary),
				Period_x0020_Start,
				cRpt.Period_x0020_End,
				cRpt.Modified,
				cRpt.Created,
				cRpt.SponsorId,
				cRpt.Project_x0020_ManagerId
				);
				dataModel[ptr].highlightReports.push(report);
		})




		cSite.period=retValidStr(cRpt.Reporting_x0020_Period);
		cSite.pm = retValidNo(cRpt.Project_x0020_ManagerId);
		cSite.sponsor = retValidNo(cRpt.SponsorId);
		cSite.summary = ;
		if (cRpt.Marval_x0020__x0023_){
			cSite.marvURI = retValidStr(cRpt.Marval_x0020__x0023_.Url);
		} else {
			cSite.marvURI = "-";
		}
		
		siteList[ptr]=cSite
		portVal.proj += cSite.fSpend;
		portVal.baseline += cSite.baseline;
		portVal.current += cSite.current;



		//Finally 
		updatePeople(ptr);
	});
}


/**
	* Builds the data model
	*
	* @param {string} listUri - URI of the SharePointmaster project list
	*/
function makeDataModel(listUri){
	$.ajax({
		url:listUri,
		headers:{"Accept": "application/json;odata=verbose"}
	}).done(function(data){
		var listItems = data.d.results; //All projects from the master projects list

		$(listItems).each(function(i){
			var hrRpt = this.Highlight_x0020_Report||{Description:"TBA",Url:"/Projects/TBA/TBA"}; // fix for crash when a list entry is first created but no site exists
			var prj = new Project(hrRpt.Description, hrRpt.Description, hrRpt.Url.match(/.+Projects\/[^\/]+/)[0], this.GUID, this.Hide, retValidNo(this.Project_x0020_ManagerId), retValidNo(this.SponsorId));
			dataModel.push(prj);
			if (dataModel[i].pmID !=0){
				var uri = "http://teams.gsg.sa.gov.au/ict/be/bussol/Projects/_api/Web/GetUserById(" + dataModel[i].pmID +")";
				$.ajax({
					url:uri,
					headers:{"Accept": "application/json;odata=verbose"}
				}).done(function(data){
					var user = data.d;
					dataModel[i].pmName = user.Title;
				});
			}
			if (dataModel[i].ownerID !=0){
				var uri = "http://teams.gsg.sa.gov.au/ict/be/bussol/Projects/_api/Web/GetUserById(" + dataModel[i].ownerID +")";
				$.ajax({
					url:uri,
					headers:{"Accept": "application/json;odata=verbose"}
				}).done(function(data){
					var user = data.d;
					dataModel[i].ownerName = user.Title;
				});
			}
			getHighlightReports(i);
		});
	});
} 

//    +++ U T I L I T Y   F U N C T I O N S +++

/**
	* Returns a valid date, the result of a moment() or a null 
	* @param {any} field - var to be tested
	*/
function getSPDate(field){
	var d = new moment(field);
	if (d.isValid()){
		return new Date(d);
	} else {
		return null;
	}
}

/**
	* Returns a valid number or 0
	* @param {any} field - var to be tested
	*/
function retValidNo(field){
	if (typeof(field)=="undefined" || isNaN(field)){
		return 0;
	} else {
		return Number(field);
	}
}

/**
	* Returns a valid string, either as the result of a toString() or as "-"
	* @param {any} field - var to be tested
	*/
function retValidStr(field){
	if (typeof(field)=="undefined"||field === null){
		return "-";
	} else {
		return field.toString();
	}
}


//    +++  C O N S T R U C T O R S +++

/**
	* Represents a project object
	*
	* @constructor
	* @param {string} t - The project title
	* @param {string} d - Description (currently reuses the title)
	* @param {string} u - Teamsite base URL  
	* @param {string} i - Sharepoint GUID for the project
	* @param {bool} h - Hidden flag
	* @param {int} p - PM SharePoint ID
	* @param {int} o - Sponsor SharePoint ID
	*
	*/
function Project(t,d,u,i,h,p,o){
	// base attributes
	this.title = retValidStr(t);
	this.desc = retValidStr(d);
	this.url = retValidStr(u);
	this.id = retValidStr(i);
	this.hidden = h;
	this.pmID = p;
	this.pmName = "";
	this.ownerID = o;
	this.ownerName = "";
	this.highlightReports = new Array();

	// Attributes from latest highlight report
	this.stage="";
	this.pct=0;
	this.health = "";
	this.sDate = 0;
	this.endDate;
}

function Report(st,pc,he,ed,fed,st,ex,ps,pe,mo,cr,sp,pm){
	this.stage = st;
	this.pct = pc;
	this.health = he;
	this.endDate = ed;
	this.

				retValidStr(cRpt.Stage),
				retValidNo(cRpt.Percent),
				retValidStr(cRpt.Pr_Health),
				cRpt.End_x0020_Date,
				cRpt.Forcast_x0020_End_x0020_Date,
				cRpt.Start_x0020_Date,
				retValidStr(cRpt.Executive_x0020_Summary),
				Period_x0020_Start,
				cRpt.Period_x0020_End,
				cRpt.Modified,
				cRpt.Created,
				cRpt.SponsorId,
				cRpt.Project_x0020_ManagerId
}

</script>
