var https = require('https');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB.DocumentClient({region:'us-east-1'});
var Promise = require('promise');

exports.handler = (event, context, callback) => {
    // TODO implement
    
    try {
		
        if (event.session.new) {

            newSessionHelper(event, context);

        } else {

            oldSessionHelper(event, context);

        }

        



    } 
	catch(error) { context.fail('Exception: '+error) }
    
    //callback(null, 'Hello from Lambda');
    
    
};


newSessionHelper = (event,context) => {
	

    

    var userid = event.session.user.userId;

    var username;
	
	
	
	

    

    switch (event.request.type) {



        case "LaunchRequest":

            // Launch Request

            respondBack("You can track your job application here.", false, {}, context);

            break;

		case "IntentRequest":


            // Intent Request
             switch(event.request.intent.name) {
                
				case "AddWithPartialDetails":
					
					if((("value" in event.request.intent.slots.Corporation) || ("value" in event.request.intent.slots.Organization)) && !("value" in event.request.intent.slots.Position) && !("value" in event.request.intent.slots.Status)) 
					{
						let company;
						if(("value" in event.request.intent.slots.Corporation)) company = event.request.intent.slots.Corporation.value;
						if(("value" in event.request.intent.slots.Organization)) company = event.request.intent.slots.Organization.value;
						console.log("Got company");
						if(event.session.attributes)
						{
							let sessionType = event.session.attributes.SessionAttributeType;
							
							//console.log(sessionType);
							if(sessionType == "AddApplicationWPositionOnly") {
								let position =  event.session.attributes.Position;
								let appStatus =  "In Progress";
								addApplication(company, position, appStatus, userid, context);
							}

						}
						else
						{
							let sessionAttributes = {
								"Company": company,
								"SessionAttributeType": "AddApplicationWCompanyOnly"
							}
							respondBack("Please specify the position you applied for.", false, sessionAttributes, context);
						}
						
						
					}
					else if(!(("value" in event.request.intent.slots.Corporation) || ("value" in event.request.intent.slots.Organization)) && ("value" in event.request.intent.slots.Position) && !("value" in event.request.intent.slots.Status))
					{
						let position = event.request.intent.slots.Position.value;
						console.log("Got position");
						if(event.session.attributes)
						{
							let sessionType = event.session.attributes.SessionAttributeType;
							
							//console.log(sessionType);
							if(sessionType == "AddApplicationWCompanyOnly") {
								let company =  event.session.attributes.Company;
								let appStatus =  "In Progress";
								addApplication(company, position, appStatus, userid, context);
							}

						}
						else 
						{
							let sessionAttributes =  {
								"Position": position,
								"SessionAttributeType": "AddApplicationWPositionOnly"
							}
							respondBack("Please specify the company you applied to.", false, sessionAttributes ,context);
						}
						
					}
					
					break;
				
				case "AMAZON.YesIntent": 
					if(event.session.attributes)
					{
						let sessionType = event.session.attributes.SessionAttributeType;
						
						console.log(sessionType);
						if(sessionType == "UpdateStatusWOApplication") {
							let company = event.session.attributes.Company;
							let position =  event.session.attributes.Position;
							let appStatus =  event.session.attributes.ApplicationStatus;
							addApplication(company, position, appStatus, userid, context);
						}

					}
					break;
				
				case "UpdateStatus":
					
					var company = "", position = "", appStatus = "";
					//console.log(company + " " + position + " " + date);
					
					if(("value" in event.request.intent.slots.Corporation) && ("value" in event.request.intent.slots.Position) && ("value" in event.request.intent.slots.Status)) 
					{
						
						//Retrieve data from input speech
						company = event.request.intent.slots.Corporation.value;
						position =  event.request.intent.slots.Position.value;
						appStatus =  event.request.intent.slots.Status.value;
						
						updateApplicationStatus(company, position, appStatus, userid, context);
						
					}
					else if(("value" in event.request.intent.slots.Organization) && ("value" in event.request.intent.slots.Position) && ("value" in event.request.intent.slots.Status)) {
						
						//Retrieve data from input speech
						company = event.request.intent.slots.Organization.value;
						position =  event.request.intent.slots.Position.value;
						appStatus =  event.request.intent.slots.Status.value;
						
						updateApplicationStatus(company, position, appStatus, userid, context);
						
					}
					
					break;
				
                case "AddDetails": 
				
				    //console.log("Add Details Intent");
                    
					var company = "", position = "", appStatus = "";
					//console.log(company + " " + position + " " + date);
					
					//Check if company name is mentioned in corporation and position is mentioned
					if(("value" in event.request.intent.slots.Corporation) && ("value" in event.request.intent.slots.Position)) {
						
						//Retrieve data from input speech
						company = event.request.intent.slots.Corporation.value;
						position =  event.request.intent.slots.Position.value;
						
						addApplication(company, position, "In Progress", userid, context);
						
						//console.log(company + " " + position + " " + date);
						
						
						
						
					}
					
					//Check if company name is mentioned in organization and position is mentioned
					else if(("value" in event.request.intent.slots.Organization) && ("value" in event.request.intent.slots.Position)) {
						
						company = event.request.intent.slots.Organization.value;
						position =  event.request.intent.slots.Position.value;
						
						addApplication(company, position, "In Progress", userid, context)
						
					}
					
					break;
                    
                case "GetDetails": 
                    console.log("Get Details Intent");
					
					var company = null, action = null, position = null, query = null, tempstatus = null, appStatus = null, applications = null, outputData = null, outputList = null;
                    
                    //Get Variables
                    if("value" in event.request.intent.slots.Corporation) {
                        company = event.request.intent.slots.Corporation.value;
                    }
                    else if("value" in event.request.intent.slots.Organization) {
                        company = event.request.intent.slots.Organization.value;
                    }  
                    
                    if("value" in event.request.intent.slots.Actions) {
                        action = event.request.intent.slots.Actions.value;
                    }
                    
                    if("value" in event.request.intent.slots.Position) {
                        position = event.request.intent.slots.Position.value;
                    }
                    
                    
                    
                    if("value" in event.request.intent.slots.Status) {
                        tempstatus = event.request.intent.slots.Status.value;
                        
                        if(tempstatus == "reject" || tempstatus == "rejects" || tempstatus == "rejected") {
                            appStatus = "Reject";
                        }
                        else if(tempstatus == "accept" || tempstatus == "accepts" || tempstatus == "accepted" || tempstatus == "offered job to" || tempstatus == "gave a job offer to" || tempstatus == "gave an offer letter to") {
                            appStatus = "Accept";
                        }
                        else if(tempstatus != null){
                            appStatus = "In Progress";
                        }
                        
                    }
                    
					//Get user applications
					var promGetUserApplications = new Promise(function(resolve,reject) {
								
						var params = {
							TableName: "JobApplications",
							Key:{
								"UserId":userid
							}
						};
						dynamodb.get(params, function(err, data) {
							//console.log(data);
							
							if (err) {
								console.log("In error");
								reject(err);
							}
							//If user already exists
							else  {
								
								applications = data["Item"]["Companies"];
								resolve([company, action, position, appStatus, applications]);
								
							}
							
							 
							
						});
					});
					
					//Resolve user input query
					promGetUserApplications.then(function(data) {
						
						//Initalize variables to its relevant data
						company = data[0];
						action = data[1];
						position = data[2];
						appStatus = data[3];
						applications = data[4];
						var noOfCompanies = applications.length;
						
						//console.log(company,action,position,appStatus,applications);
						
						//Determine query and resolve it.
						if(action == "list of companies" || action == "companies list" || action == "companies") {
							//query  = "SELECT DISTINCT CompanyName FROM Job_CompanyDetails";
							
							
							
							outputList = applications.filter(function(tempCompany) {
								return tempCompany.Company;
							});
							//console.log(outputList, appStatus, position);
							
							if(position != null) {
								
								outputList = applications.filter(function(tempCompany) {
									var tempData = tempCompany.Applications.filter(function(tempApplication){
										if(tempApplication.Position == position) {
											return tempApplication;
										}
									});
									
									if(tempData.length != 0) {
										return tempCompany.Company;
									}
								});
								//console.log("In Pos",outputList);
							}
							else if(appStatus != null) {
								
								if(appStatus == "Reject") {
									//query = "SELECT DISTINCT CD.CompanyName FROM Job_CompanyDetails CD JOIN Job_ApplicationStatus AS ON CD.CompanyId = AS.CompanyId WHERE AS.ApplicationStatus = 'Reject'";
									
									outputList = applications.filter(function(tempCompany) {
										var tempData = tempCompany.Applications.filter(function(tempApplication){
											if(tempApplication.ApplicationStatus == "Reject") {
												return tempApplication;
											}
										});
										
										if(tempData.length != 0) {
											return tempCompany.Company;
										}
									});
								}
								else if(appStatus == "Accept") {
									//query = "SELECT DISTINCT CD.CompanyName FROM Job_CompanyDetails CD JOIN Job_ApplicationStatus AS ON CD.CompanyId = AS.CompanyId WHERE AS.ApplicationStatus = 'Accept'";
									outputList = applications.filter(function(tempCompany) {
										var tempData = tempCompany.Applications.filter(function(tempApplication){
											if(tempApplication.ApplicationStatus == "Accept") {
												return tempApplication;
											}
										});
										
										if(tempData.length != 0) {
											return tempCompany.Company;
										}
									});
								}
								else {
									//query = "SELECT DISTINCT CD.CompanyName FROM Job_CompanyDetails CD JOIN Job_ApplicationStatus AS ON CD.CompanyId = AS.CompanyId WHERE AS.ApplicationStatus <> 'Accept' AND AS.ApplicationStatus <> 'Reject'";
									
									outputList = applications.filter(function(tempCompany) {
										var tempData = tempCompany.Applications.filter(function(tempApplication){
											if(tempApplication.ApplicationStatus != "Reject" && tempApplication.ApplicationStatus != "Accept") {
												return tempApplication;
											}
										});
										
										if(tempData.length != 0) {
											return tempCompany.Company;
										}
									});
								
								
								}
								//console.log("In Status",outputList);
								
							}
							//console.log(outputList.length);
							
							var tempOutputList = [];
							for(var i = 0; i < outputList.length; i++) {
								console.log(i,outputList[i],outputList[i].Company);
								tempOutputList[i] = outputList[i].Company;
							}
							outputData = tempOutputList.join();
							//console.log(outputList, outputData);
							respondBack(outputData,false,{},context);
						}
						else if(action == "list of positions" || action == "positions list" || action == "positions") {
							//query  = "SELECT DISTINCT ApplicationPosition FROM Job_Applications";
							var tempOutputList = [];
							
							
							
							if(company != null) {
								//query = "SELECT AD.ApplicationPosition FROM Job_CompanyDetails CD JOIN Job_Applications A ON CD.CompanyId = A.CompanyId WHERE CD.CompanyName = '" + company + "'";
								
								for(var i = 0; i < noOfCompanies; i++) {
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										var listOfApplications = applications[i].Applications;
										
										for(var j = 0; j < listOfApplications.length; j++) {
											if(!(listOfApplications[j].Position in tempOutputList)) {
												tempOutputList.push(listOfApplications[j].Position);
											}
										}
									}
									
								}
							}
							else {
								for(var i = 0; i < noOfCompanies; i++) {
									var listOfApplications = applications[i].Applications;
									
									for(var j = 0; j < listOfApplications.length; j++) {
										if(!(listOfApplications[j].Position in tempOutputList)) {
											tempOutputList.push(listOfApplications[j].Position);
										}
									}
								}
							}
							outputData = Array.from(new Set(tempOutputList)).join();
							respondBack(outputData,false,{},context);
						}
						else if((action == "when" || action == "date") && company != null) {
							
							var tempOutputList = [];
							//Complete it
							if(position != null) {
								//query  = "SELECT AD.ApplicationTimestamp FROM Job_CompanyDetails CD JOIN Job_Applications A ON CD.CompanyId = A.CompanyId WHERE CD.CompanyName = '" + company + "' AND A.ApplicationPosition = '" + position + "'"; 
								for(var i = 0; i < noOfCompanies; i++) {
									
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										
										var listOfApplications = applications[i].Applications;
										for(var j = 0; j < listOfApplications.length; j++) {
											if(listOfApplications[j].Position.toLowerCase() == position.toLowerCase()) {
												
												var appDate = new Date(listOfApplications[j].TimeStamp);
												outputData = appDate.toDateString();
												
											}
										}
									}
									
								}
							}
							else {
								//query  = "SELECT AD.ApplicationTimestamp FROM Job_CompanyDetails CD JOIN Job_Applications A ON CD.CompanyId = A.CompanyId WHERE CD.CompanyName = '" + company + "' ORDER BY A.ApplicationTimestamp";
								for(var i = 0; i < noOfCompanies; i++) {
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										
										var listOfApplications = applications[i].Applications;
										var appDate = new Date(listOfApplications[listOfApplications.length - 1].TimeStamp);
										outputData = appDate.toDateString();
										
									}
									
								}
							}
							respondBack(outputData,false,{},context);
							
						}
						else if(action == "status" && company != null) {
							
							//Complete it
							if(position != null) {
								//query  = "SELECT AD.ApplicationTimestamp FROM Job_CompanyDetails CD JOIN Job_ApplicationDetails AD ON CD.CompanyId = AD.CompanyId WHERE CD.CompanyName = '" + company + "' AND AD.ApplicationPosition = '" + position + "'"; 
							
								for(var i = 0; i < noOfCompanies; i++) {
									
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										
										var listOfApplications = applications[i].Applications;
										for(var j = 0; j < listOfApplications.length; j++) {
											if(listOfApplications[j].Position.toLowerCase() == position.toLowerCase()) {
												outputData = listOfApplications[j].ApplicationStatus;
											}
										}
									}
									
								}
							}
							else {
								//query  = "SELECT AD.ApplicationTimestamp FROM Job_CompanyDetails CD JOIN Job_ApplicationDetails AD ON CD.CompanyId = AD.CompanyId WHERE CD.CompanyName = '" + company + "' ORDER BY AD.ApplicationTimestamp";
								for(var i = 0; i < noOfCompanies; i++) {
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										
										var listOfApplications = applications[i].Applications;
										outputData = listOfApplications[listOfApplications.length - 1].ApplicationStatus;
										
										
									}
									
								}
							}
							respondBack(outputData,false,{},context);
						}
						else {
							query = "";
							respondBack("I do not understand, please give a valid query as an input",false,{},context);
						}
						console.log("Output1: ",outputList);
						console.log("Output2: ",outputData);
					});
					
					
					
                    
                    break;
                    
            }

            
            break;
		
			
        case "SessionEndedRequest":

            // Session Ended Request
            //respondBack("Please visit back to Application Tracker. Goodbye!", true, {}, context);
            context.succeed();
			break;



        default:

            context.fail('INVALID REQUEST TYPE: '+event.request.type);

    }

}

oldSessionHelper = (event, context) => {

	var userid = event.session.user.userId;

    var username;

    

    switch (event.request.type) {



        case "IntentRequest":


            // Intent Request
             switch(event.request.intent.name) {
                
				case "AddWithPartialDetails":
					
					if((("value" in event.request.intent.slots.Corporation) || ("value" in event.request.intent.slots.Organization)) && !("value" in event.request.intent.slots.Position) && !("value" in event.request.intent.slots.Status)) 
					{
						let company;
						if(("value" in event.request.intent.slots.Corporation)) company = event.request.intent.slots.Corporation.value;
						if(("value" in event.request.intent.slots.Organization)) company = event.request.intent.slots.Organization.value;
						console.log("Got company");
						if(event.session.attributes)
						{
							let sessionType = event.session.attributes.SessionAttributeType;
							
							//console.log(sessionType);
							if(sessionType == "AddApplicationWPositionOnly") {
								let position =  event.session.attributes.Position;
								let appStatus =  "In Progress";
								addApplication(company, position, appStatus, userid, context);
							}

						}
						else
						{
							let sessionAttributes = {
								"Company": company,
								"SessionAttributeType": "AddApplicationWCompanyOnly"
							}
							respondBack("Please specify the position you applied for.", false, sessionAttributes, context);
						}
						
						
					}
					else if(!(("value" in event.request.intent.slots.Corporation) || ("value" in event.request.intent.slots.Organization)) && ("value" in event.request.intent.slots.Position) && !("value" in event.request.intent.slots.Status))
					{
						let position = event.request.intent.slots.Position.value;
						console.log("Got position");
						if(event.session.attributes)
						{
							let sessionType = event.session.attributes.SessionAttributeType;
							
							//console.log(sessionType);
							if(sessionType == "AddApplicationWCompanyOnly") {
								let company =  event.session.attributes.Company;
								let appStatus =  "In Progress";
								addApplication(company, position, appStatus, userid, context);
							}

						}
						else 
						{
							let sessionAttributes =  {
								"Position": position,
								"SessionAttributeType": "AddApplicationWPositionOnly"
							}
							respondBack("Please specify the company you applied to.", false, sessionAttributes ,context);
						}
						
					}
					
					break;
				
				case "AMAZON.YesIntent": 
					if(event.session.attributes)
					{
						let sessionType = event.session.attributes.SessionAttributeType;
						
						console.log(sessionType);
						if(sessionType == "UpdateStatusWOApplication") {
							let company = event.session.attributes.Company;
							let position =  event.session.attributes.Position;
							let appStatus =  event.session.attributes.ApplicationStatus;
							addApplication(company, position, appStatus, userid, context);
						}

					}
					break;
				
				case "UpdateStatus":
					
					var company = "", position = "", appStatus = "";
					//console.log(company + " " + position + " " + date);
					
					if(("value" in event.request.intent.slots.Corporation) && ("value" in event.request.intent.slots.Position) && ("value" in event.request.intent.slots.Status)) 
					{
						
						//Retrieve data from input speech
						company = event.request.intent.slots.Corporation.value;
						position =  event.request.intent.slots.Position.value;
						appStatus =  event.request.intent.slots.Status.value;
						
						updateApplicationStatus(company, position, appStatus, userid, context);
						
					}
					else if(("value" in event.request.intent.slots.Organization) && ("value" in event.request.intent.slots.Position) && ("value" in event.request.intent.slots.Status)) {
						
						//Retrieve data from input speech
						company = event.request.intent.slots.Organization.value;
						position =  event.request.intent.slots.Position.value;
						appStatus =  event.request.intent.slots.Status.value;
						
						updateApplicationStatus(company, position, appStatus, userid, context);
						
					}
					
					break;
				
                case "AddDetails": 
				
				    //console.log("Add Details Intent");
                    
					var company = "", position = "", appStatus = "";
					//console.log(company + " " + position + " " + date);
					
					//Check if company name is mentioned in corporation and position is mentioned
					if(("value" in event.request.intent.slots.Corporation) && ("value" in event.request.intent.slots.Position)) {
						
						//Retrieve data from input speech
						company = event.request.intent.slots.Corporation.value;
						position =  event.request.intent.slots.Position.value;
						
						addApplication(company, position, "In Progress", userid, context);
						
						//console.log(company + " " + position + " " + date);
						
						
						
						
					}
					
					//Check if company name is mentioned in organization and position is mentioned
					else if(("value" in event.request.intent.slots.Organization) && ("value" in event.request.intent.slots.Position)) {
						
						company = event.request.intent.slots.Organization.value;
						position =  event.request.intent.slots.Position.value;
						
						addApplication(company, position, "In Progress", userid, context)
						
					}
					
					break;
                    
                case "GetDetails": 
                    console.log("Get Details Intent");
					
					var company = null, action = null, position = null, query = null, tempstatus = null, appStatus = null, applications = null, outputData = null, outputList = null;
                    
                    //Get Variables
                    if("value" in event.request.intent.slots.Corporation) {
                        company = event.request.intent.slots.Corporation.value;
                    }
                    else if("value" in event.request.intent.slots.Organization) {
                        company = event.request.intent.slots.Organization.value;
                    }  
                    
                    if("value" in event.request.intent.slots.Actions) {
                        action = event.request.intent.slots.Actions.value;
                    }
                    
                    if("value" in event.request.intent.slots.Position) {
                        position = event.request.intent.slots.Position.value;
                    }
                    
                    
                    
                    if("value" in event.request.intent.slots.Status) {
                        tempstatus = event.request.intent.slots.Status.value;
                        
                        if(tempstatus == "reject" || tempstatus == "rejects" || tempstatus == "rejected") {
                            appStatus = "Reject";
                        }
                        else if(tempstatus == "accept" || tempstatus == "accepts" || tempstatus == "accepted" || tempstatus == "offered job to" || tempstatus == "gave a job offer to" || tempstatus == "gave an offer letter to") {
                            appStatus = "Accept";
                        }
                        else if(tempstatus != null){
                            appStatus = "In Progress";
                        }
                        
                    }
                    
					//Get user applications
					var promGetUserApplications = new Promise(function(resolve,reject) {
								
						var params = {
							TableName: "JobApplications",
							Key:{
								"UserId":userid
							}
						};
						dynamodb.get(params, function(err, data) {
							//console.log(data);
							
							if (err) {
								console.log("In error");
								reject(err);
							}
							//If user already exists
							else  {
								
								applications = data["Item"]["Companies"];
								resolve([company, action, position, appStatus, applications]);
								
							}
							
							 
							
						});
					});
					
					//Resolve user input query
					promGetUserApplications.then(function(data) {
						
						//Initalize variables to its relevant data
						company = data[0];
						action = data[1];
						position = data[2];
						appStatus = data[3];
						applications = data[4];
						var noOfCompanies = applications.length;
						
						//console.log(company,action,position,appStatus,applications);
						
						//Determine query and resolve it.
						if(action == "list of companies" || action == "companies list" || action == "companies") {
							//query  = "SELECT DISTINCT CompanyName FROM Job_CompanyDetails";
							
							
							
							outputList = applications.filter(function(tempCompany) {
								return tempCompany.Company;
							});
							//console.log(outputList, appStatus, position);
							
							if(position != null) {
								
								outputList = applications.filter(function(tempCompany) {
									var tempData = tempCompany.Applications.filter(function(tempApplication){
										if(tempApplication.Position == position) {
											return tempApplication;
										}
									});
									
									if(tempData.length != 0) {
										return tempCompany.Company;
									}
								});
								//console.log("In Pos",outputList);
							}
							else if(appStatus != null) {
								
								if(appStatus == "Reject") {
									//query = "SELECT DISTINCT CD.CompanyName FROM Job_CompanyDetails CD JOIN Job_ApplicationStatus AS ON CD.CompanyId = AS.CompanyId WHERE AS.ApplicationStatus = 'Reject'";
									
									outputList = applications.filter(function(tempCompany) {
										var tempData = tempCompany.Applications.filter(function(tempApplication){
											if(tempApplication.ApplicationStatus == "Reject") {
												return tempApplication;
											}
										});
										
										if(tempData.length != 0) {
											return tempCompany.Company;
										}
									});
								}
								else if(appStatus == "Accept") {
									//query = "SELECT DISTINCT CD.CompanyName FROM Job_CompanyDetails CD JOIN Job_ApplicationStatus AS ON CD.CompanyId = AS.CompanyId WHERE AS.ApplicationStatus = 'Accept'";
									outputList = applications.filter(function(tempCompany) {
										var tempData = tempCompany.Applications.filter(function(tempApplication){
											if(tempApplication.ApplicationStatus == "Accept") {
												return tempApplication;
											}
										});
										
										if(tempData.length != 0) {
											return tempCompany.Company;
										}
									});
								}
								else {
									//query = "SELECT DISTINCT CD.CompanyName FROM Job_CompanyDetails CD JOIN Job_ApplicationStatus AS ON CD.CompanyId = AS.CompanyId WHERE AS.ApplicationStatus <> 'Accept' AND AS.ApplicationStatus <> 'Reject'";
									
									outputList = applications.filter(function(tempCompany) {
										var tempData = tempCompany.Applications.filter(function(tempApplication){
											if(tempApplication.ApplicationStatus != "Reject" && tempApplication.ApplicationStatus != "Accept") {
												return tempApplication;
											}
										});
										
										if(tempData.length != 0) {
											return tempCompany.Company;
										}
									});
								
								
								}
								//console.log("In Status",outputList);
								
							}
							//console.log(outputList.length);
							
							var tempOutputList = [];
							for(var i = 0; i < outputList.length; i++) {
								console.log(i,outputList[i],outputList[i].Company);
								tempOutputList[i] = outputList[i].Company;
							}
							outputData = tempOutputList.join();
							//console.log(outputList, outputData);
							respondBack(outputData,false,{},context);
						}
						else if(action == "list of positions" || action == "positions list" || action == "positions") {
							//query  = "SELECT DISTINCT ApplicationPosition FROM Job_Applications";
							var tempOutputList = [];
							
							
							
							if(company != null) {
								//query = "SELECT AD.ApplicationPosition FROM Job_CompanyDetails CD JOIN Job_Applications A ON CD.CompanyId = A.CompanyId WHERE CD.CompanyName = '" + company + "'";
								
								for(var i = 0; i < noOfCompanies; i++) {
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										var listOfApplications = applications[i].Applications;
										
										for(var j = 0; j < listOfApplications.length; j++) {
											if(!(listOfApplications[j].Position in tempOutputList)) {
												tempOutputList.push(listOfApplications[j].Position);
											}
										}
									}
									
								}
							}
							else {
								for(var i = 0; i < noOfCompanies; i++) {
									var listOfApplications = applications[i].Applications;
									
									for(var j = 0; j < listOfApplications.length; j++) {
										if(!(listOfApplications[j].Position in tempOutputList)) {
											tempOutputList.push(listOfApplications[j].Position);
										}
									}
								}
							}
							outputData = Array.from(new Set(tempOutputList)).join();
							respondBack(outputData,false,{},context);
						}
						else if((action == "when" || action == "date") && company != null) {
							
							var tempOutputList = [];
							//Complete it
							if(position != null) {
								//query  = "SELECT AD.ApplicationTimestamp FROM Job_CompanyDetails CD JOIN Job_Applications A ON CD.CompanyId = A.CompanyId WHERE CD.CompanyName = '" + company + "' AND A.ApplicationPosition = '" + position + "'"; 
								for(var i = 0; i < noOfCompanies; i++) {
									
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										
										var listOfApplications = applications[i].Applications;
										for(var j = 0; j < listOfApplications.length; j++) {
											if(listOfApplications[j].Position.toLowerCase() == position.toLowerCase()) {
												
												var appDate = new Date(listOfApplications[j].TimeStamp);
												outputData = appDate.toDateString();
												
											}
										}
									}
									
								}
							}
							else {
								//query  = "SELECT AD.ApplicationTimestamp FROM Job_CompanyDetails CD JOIN Job_Applications A ON CD.CompanyId = A.CompanyId WHERE CD.CompanyName = '" + company + "' ORDER BY A.ApplicationTimestamp";
								for(var i = 0; i < noOfCompanies; i++) {
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										
										var listOfApplications = applications[i].Applications;
										var appDate = new Date(listOfApplications[listOfApplications.length - 1].TimeStamp);
										outputData = appDate.toDateString();
										
									}
									
								}
							}
							respondBack(outputData,false,{},context);
							
						}
						else if(action == "status" && company != null) {
							
							//Complete it
							if(position != null) {
								//query  = "SELECT AD.ApplicationTimestamp FROM Job_CompanyDetails CD JOIN Job_ApplicationDetails AD ON CD.CompanyId = AD.CompanyId WHERE CD.CompanyName = '" + company + "' AND AD.ApplicationPosition = '" + position + "'"; 
							
								for(var i = 0; i < noOfCompanies; i++) {
									
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										
										var listOfApplications = applications[i].Applications;
										for(var j = 0; j < listOfApplications.length; j++) {
											if(listOfApplications[j].Position.toLowerCase() == position.toLowerCase()) {
												outputData = listOfApplications[j].ApplicationStatus;
											}
										}
									}
									
								}
							}
							else {
								//query  = "SELECT AD.ApplicationTimestamp FROM Job_CompanyDetails CD JOIN Job_ApplicationDetails AD ON CD.CompanyId = AD.CompanyId WHERE CD.CompanyName = '" + company + "' ORDER BY AD.ApplicationTimestamp";
								for(var i = 0; i < noOfCompanies; i++) {
									if(applications[i].Company.toLowerCase() == company.toLowerCase()) {
										
										var listOfApplications = applications[i].Applications;
										outputData = listOfApplications[listOfApplications.length - 1].ApplicationStatus;
										
										
									}
									
								}
							}
							respondBack(outputData,false,{},context);
						}
						else {
							query = "";
							respondBack("I do not understand, please give a valid query as an input",false,{},context);
						}
						console.log("Output1: ",outputList);
						console.log("Output2: ",outputData);
					});
					
					
					
                    
                    break;
                    
            }

            
            break;



        case "SessionEndedRequest":

            // Session Ended Request
            //respondBack("Please visit back to Application Tracker. Goodbye!", true, {}, context);
			context.succeed();
            break;



        default:

            context.fail('INVALID REQUEST TYPE: '+event.request.type);

    }

   

}

//Add application
addApplication = (company, position, applicationStatus, userid, context) => {
	
	try 
	{
		var companyId, userFlag = true, companyFlag = false, date = null, added = null;
					
		date = new Date();
		date = date.toDateString();
							
		//Create promise to check if user and company exists in database
		var promCheckInDB = new Promise(function(resolve,reject) {
			
			var params = {
				TableName: "JobApplications",
				Key:{
					"UserId":userid
				}
			};
			dynamodb.get(params, function(err, data) {
				//console.log(data);
				
				if (err) {
					console.log("In error");
					reject(err);
				}
				//If user already exists
				else if(Object.keys(data).length != 0) {
					
					//Check if company exists
					var listOfCompanies = data["Item"]["Companies"]
					var noOfCompanies = listOfCompanies.length;
					var ind = -1;
					
					//Get the index of mentioned company in the Companies list of user
					for(var i = 0; i < noOfCompanies; i++) {
						if(listOfCompanies[i]["Company"].toLowerCase() == company.toLowerCase()) {
							companyFlag = true;
							ind = i;
						}
					}
					//console.log(companyFlag);
					resolve([userFlag, companyFlag, ind]);
					
				}
				//If user does not exists
				else if(Object.keys(data).length == 0) {
					userFlag = false;
					companyFlag = false;
					//console.log("In Data is null");
					
					resolve([userFlag, companyFlag]);
				}
				 
				
			});
		});
		
		//Execute then clause for promCheckInDB
		promCheckInDB.then(function(flags) {
			//console.log("In then" + flags[0] + " " + flags[1]);
			//console.log(company);
			
			//Promise to add a new application to the database
			var promPerformOperation = new Promise(function(resolve, reject){
				
				//Add user along with its application to the database
				if(!flags[0]) {
					
					var noUser = {
						TableName: "JobApplications",
						Item: {
							"UserId": userid,
							"Companies": [
								{ 
								"Company": company,
								"Applications":
									[ 
									{
										"Position": position,
										"ApplicationStatus": applicationStatus,
										"TimeStamp": date
									}
									]
								}
							]
						}
					};
					
					
					//console.log(noUser);
					dynamodb.put(noUser, function(err, data) {
						
						if(err) {
							added = false;
							console.log(err);
							reject(err);
						}
						else {
							added = true;
							resolve(added);
						}
					});
				}
				//Add a new company for particular user existing in database 
				else if(flags[0] && !flags[1]) {
					
					//console.log("When company is present.");
					
					
					var noCompanyDataParams = {
						TableName: "JobApplications",
						Key: {
							"UserId": userid
						},
						UpdateExpression: 'SET Companies = list_append(Companies, :value)',
						ExpressionAttributeValues: {
							':value': [{ 
								"Company": company,
								"Applications":
									[ 
									{
										"Position": position,
										"ApplicationStatus": applicationStatus,
										"TimeStamp": date
									}
									]
								}]
						},
						ReturnValues: 'UPDATED_NEW'
					};
					
					dynamodb.update(noCompanyDataParams, function(err, data) {
						//console.log("In update" + data);
						if(err) {
							added = false;
							console.log(err);
							reject(err);
						}
						else {
							added = true;
							resolve(added);
						}
					});
				}
				
				//Add a new application for a existing user and company
				else if(flags[0] && flags[1]) {
					//console.log("When company is present.");
					
					var companyDataParams = {
						TableName: "JobApplications",
						Key: {
							"UserId": userid
						},
						UpdateExpression: 'SET Companies[' + flags[2] +'].Applications = list_append(Companies[' + flags[2] +'].Applications, :value)',
						ExpressionAttributeValues: {
							':value': [
									{
										"Position": position,
										"ApplicationStatus": applicationStatus,
										"TimeStamp": date
									}
								]
						},
						ReturnValues: 'UPDATED_NEW'
					};
					dynamodb.update(companyDataParams, function(err, data) {
						//console.log("In update" + data);
						if(err) {
							added = false;
							console.log(err);
							reject(err);
						}
						else {
							added = true;
							resolve(added);
						}
					});
				}
			});
			
			//Execute then clause for promPerformOperation to respond back to the user.
			promPerformOperation.then(function(added){
				respondBack("Your application has been added.", false, {}, context);
			}).catch(function(err) {
				console.log("We got an error",err);
			});
			
		}).catch(function(err) {
			console.log("We got an error",err);
		});
		
	} 
	catch(error) { context.fail('Exception: '+error); }
}


//Update application status
updateApplicationStatus = (company, position, appStatus, userid, context) => {
	
	var companyId, appFlag = null;
				
	date = new Date();
	date = date.toDateString();
						
	//Create promise to check if user and company exists in database
	var promCheckInDB = new Promise(function(resolve,reject) {
		 
		let application = null, comp = null; 
		
		var params = {
			TableName: "JobApplications",
			Key:{
				"UserId":userid
			}
		};
		dynamodb.get(params, function(err, data) {
			//console.log(data);
			
			if (err) {
				console.log("In error");
				reject(err);
			}
			//If user already exists
			else if(Object.keys(data).length != 0) {
				
				//Check if company exists
				var listOfCompanies = data["Item"]["Companies"]
				comp = listOfCompanies.findIndex(function(tempCompany) {
					return tempCompany.Company == company;
				});
				
				
				if(comp != -1) {
					let applications = listOfCompanies[comp].Applications; 
					application = applications.findIndex(function(app) {
						return app.Position == position;
					});
				}
				
				
				
				if(application != -1) {
					if(listOfCompanies[comp].Applications[application].ApplicationStatus != appStatus) {
						appFlag = true;
					} 
					else {
						respondBack("Your application status was already updated", false, {}, context);
					}
					
				}
				else {
					appFlag = false;
				}
				resolve([appFlag, comp, application]);
				
			}
			//If user does not exists
			else if(Object.keys(data).length == 0) {
				resolve([appFlag, comp, application]);
			}
		});
	});
	
	//Complete it
	promCheckInDB.then(function(data) {
		
		
		if(appFlag) {
			let companyIndex = data[1];
			let applicationIndex = data[2];
			var promUpdateStatus = new Promise(function(resolve, reject) {
				
				var updateStatusDataParams = {
					TableName: "JobApplications",
					Key: {
						"UserId": userid
					},
					UpdateExpression: 'SET Companies[' + companyIndex +'].Applications[' + applicationIndex + '].ApplicationStatus = :value',
					ExpressionAttributeValues: {
						':value': appStatus
					},
					ReturnValues: 'UPDATED_NEW'
				};
				
				dynamodb.update(updateStatusDataParams , function(err, data) {
					console.log(err + "In update" + data);
					if(err) {
						reject(err);
					}
					else {
						resolve("Yes");
					}
				});
			});
			
			promUpdateStatus.then(function(statusUpdatedFlag){ 
				
				if(statusUpdatedFlag == "Yes") {
					respondBack("Your application status have been updated", false, {}, context);
				} 
			});
			
		}
		else if(!appFlag) {
			let sessionAttributes = {
				"Company": company,
				"Position": position,
				"ApplicationStatus": appStatus,
				"SessionAttributeType": "UpdateStatusWOApplication"
			};
			respondBack("Cannot find the specified application. Do you want to add it as a new application?", false, sessionAttributes, context);
		}
		else if(appFlag == null) {
			addApplication(company, position, appStatus, userid, context);
		}
		console.log(flags);
	});
}

//Reponse Cards

respondBack = (response, endSession, attributes, context) => {

    context.succeed(

        generateResponse(

            buildSpeechletResponse(response, endSession),

            attributes

        )

    )

}



errorResponse = (context) => {

    respondBack("I don't know what you meant by that. Can you please try again?", true, {}, context);

}



// Speechlet Helpers

buildSpeechletResponse = (outputText, shouldEndSession) => {



    return {

        outputSpeech: {

            type: "PlainText",

            text: outputText

        },

        shouldEndSession: shouldEndSession

    }



}



generateResponse = (speechletResponse, sessionAttributes) => {



    return {

        version: "1.0",

        sessionAttributes: sessionAttributes,

        response: speechletResponse

    }



}

