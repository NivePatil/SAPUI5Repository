sap.ui.define([], function() {
    //	"use strict";
    
        return {
    
            formatDate : function(sValue) {
                
                if (sValue) {
                    if(sValue>11 == true){
                    return (sValue.getMonth() + 1) + "/" + sValue.getDate() + "/"
                            + sValue.getFullYear();
                    }
                    else{
                        return sValue;
                    }
                }
            },
    
            concatString : function(val1, val2) {
                return val1 + "-" + val2;
            },
            
             
            PlanCheckInDtButtonVis : function(PlanCheckInDt, ActCheckInDt, SystemDate){
                var state = "Default";
                
                if (PlanCheckInDt !== null ) {
                      if ((ActCheckInDt === null ) && (PlanCheckInDt > SystemDate)) {
                             state = "Default";
                      }  
                      if ((ActCheckInDt === null ) && (PlanCheckInDt < SystemDate)) {
                             state = "Reject";
                      } 
                      if ((ActCheckInDt !== null ) && (ActCheckInDt <= PlanCheckInDt)) {
                             state = "Accept";
                      }
                      if ((ActCheckInDt !== null ) && (ActCheckInDt > PlanCheckInDt)){
                             state = "Emphasized";
                      }
                } 
                
                return state;
         },
    
            
            
            PlanDepartureDtButtonVis : function(PlanShpmntStartDt, ActShpmntStartDt, SystemDate){
                var state;
                if (PlanShpmntStartDt !== null) {
                    if ((ActShpmntStartDt === null) && (PlanShpmntStartDt > SystemDate)) {
                        state =  "Default";
                    }  
                    if ((ActShpmntStartDt === null) && (PlanShpmntStartDt < SystemDate)) {
                        state = "Reject";
                    } 
                    if ((ActShpmntStartDt !== null) && (ActShpmntStartDt <= PlanShpmntStartDt)) {
                        state = "Accept";
                    }
                    if ((ActShpmntStartDt !== null) && (ActShpmntStartDt > PlanShpmntStartDt)){
                        state = "Emphasized";
                    }
                } 
                return state;
            },
            
            
            PlanArrvDtButtonVis : function(PlanShpmntEndDt, ActShpmntEndDt, SystemDate){
                var state;
                if (PlanShpmntEndDt !==null) {
                    if ((ActShpmntEndDt === null) && (PlanShpmntEndDt > SystemDate)) {
                        state =  "Default";
                    }  
                    if ((ActShpmntEndDt === null) && (PlanShpmntEndDt < SystemDate)) {
                        state = "Reject";
                    } 
                    if ((ActShpmntEndDt !== null) && (ActShpmntEndDt <= PlanShpmntEndDt)) {
                        state = "Accept";
                    }
                    if ((ActShpmntEndDt !== null) && (ActShpmntEndDt > PlanShpmntEndDt)){
                        state = "Emphasized";
                    }
                } 
                return state;
            },
            
            convertDate: function(str) {
                 
                var date = new Date(str),
                    mnth = ("0" + (date.getMonth()+1)).slice(-2),
                    day  = ("0" + date.getDate()).slice(-2);
                var hours  = ("0" + date.getHours()).slice(-2);
                var minutes = ("0" + date.getMinutes()).slice(-2);
                var sec = ("0" + date.getSeconds()).slice(-2);
                var dateYMD = [date.getFullYear(), mnth, day].join("-"); //year month and Day
                var Thours  = [dateYMD, hours].join("T"); // concatinating T
                return [Thours, minutes, sec].join(":");
                        
               // return [ date.getFullYear(), mnth, day, hours, minutes, sec ].join("-");
            },
            
            convertDateUTC: function(str) {
                 
                var date = new Date(str),
                    mnth = ("0" + (date.getUTCMonth()+1)).slice(-2),
                    day  = ("0" + date.getUTCDate()).slice(-2);
                var hours  = ("0" + date.getUTCHours()).slice(-2);
                var minutes = ("0" + date.getUTCMinutes()).slice(-2);
                var sec = ("0" + date.getUTCSeconds()).slice(-2);
                var dateYMD = [date.getUTCFullYear(), mnth, day].join("-"); //year month and Day
                var Thours  = [dateYMD, hours].join("T"); // concatinating T
                return [Thours, minutes, sec].join(":");
                
                 
                        
               // return [ date.getFullYear(), mnth, day, hours, minutes, sec ].join("-");
            },
            
            convertmilisUTC: function(str) {
                var date = new Date(str);
                var millis = date.getTime() + (date.getTimezoneOffset() * 60000);
                return millis;
            },
            
            convertDateTime: function(str,str2) {
                 
                var date = new Date(str),
                  date2 =  new Date(str2),
                    mnth = ("0" + (date.getMonth()+1)).slice(-2),
                    day  = ("0" + date.getDate()).slice(-2);
               // var hours  = ("0" + date.getHours()).slice(-2);
               // var minutes = ("0" + date.getMinutes()).slice(-2);
                //var sec = ("0" + date.getSeconds()).slice(-2);
                var hours  = ("0" + date2.getHours()).slice(-2);
                var minutes = ("0" + date2.getMinutes()).slice(-2);
                var sec = ("0" + date2.getSeconds()).slice(-2);
                var dateYMD = [date.getFullYear(), mnth, day].join("-"); //year month and Day
                var Thours  = [dateYMD, hours].join("T"); // concatinating T
                return [Thours, minutes, sec].join(":");
                        
               // return [ date.getFullYear(), mnth, day, hours, minutes, sec ].join("-");
            },
            
            
            fnVisiblePldDepDt :function(PlanShpmntStartDt, ShpmntType){
                var visible = true;
                if((PlanShpmntStartDt) && ShpmntType === "Z010"){
                    visible = false;
                }
                
                else if((PlanShpmntStartDt) && ShpmntType === "Z001"){
                    visible = true;
                }
                
                return visible;
            },
            
            
            fnVisibleActDepDt :function (ActShpmntStartDt, ShpmntType){
                var visible = true;
                if((ActShpmntStartDt) && ShpmntType === "Z010"){
                    visible = false;
                }
                
                else if((ActShpmntStartDt) && ShpmntType === "Z001"){
                    visible = true;
                }
                
                return visible;
            },
            
            
            
            fnVisiblePldArvDt :function (PlanShpmntEndDt, ShpmntType){
                var visible = true;
                if((PlanShpmntEndDt) && ShpmntType === "Z010"){
                    visible = false;
                }
                
                else if((PlanShpmntEndDt) && ShpmntType === "Z001"){
                    visible = true;
                }
                
                return visible;
            },
            
            
            fnVisibleActArvDt :function (ActShpmntEndDt, ShpmntType){
                var visible = true;
                if((ActShpmntEndDt) && ShpmntType === "Z010"){
                    visible = false;
                }
                
                else if((ActShpmntEndDt) && ShpmntType === "Z001"){
                    visible = true;
                }
                
                return visible;
            },
            
            
            fnForwadEnabled : function(FwdAgent, ShippingTyp) {
                var enabled = false;
                if (ShippingTyp === "01") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
    
                return enabled;
            },
            
            //to make column editable on value of ship status
            inputEnabled : function(OverallStatus) {
                var enabled = false;
                if (OverallStatus === "0") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
    
                return enabled;
            },
            
            editablePldDates:function(OverallStatus,IEPreClrStatus,ShpmntType,PlanShpmntComplDt) {
                var enabled = false;
    //			start RFC#7000012672:CD#2000029495:enable Pln  Pick date based on shipment type,IEPre,status
                if(ShpmntType ==="Z004" || ShpmntType === "Z006"){
                if(IEPreClrStatus === "Z001" || IEPreClrStatus === "Z004" || IEPreClrStatus === "Z002" || IEPreClrStatus === "Z003" ){
                if (OverallStatus === "0" || OverallStatus === "1") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
                }
                }//end if of shipment type
                
                else{
                    if(IEPreClrStatus === "Z001" || IEPreClrStatus === "Z004" ){
                        if (OverallStatus === "0" || OverallStatus === "1") {
                            if(PlanShpmntComplDt !== null){
                            enabled = true;
                            }
                        }
                        
                        else{
                            enabled = false;
                        }
                        }
                }
                
    //			end RFC#7000012672:CD#2000029495:enable Pln  Pick date based on shipment type,IEPre,status		
                return enabled;
            },
            
    //		start RFC#7000012672:CD#2000029495:enable Pln  Pick date based on shipment type,IEPre,status
    
            minDatePlnPick: function(SystemDate,PlanShpmntComplDt) {
                //set recent date as min date
                var mindate = SystemDate;
                if(PlanShpmntComplDt !== ""){
            if(SystemDate <  PlanShpmntComplDt ){		
                mindate = PlanShpmntComplDt;
            }
            else{
                mindate = SystemDate;
                }
            }
                return mindate;
            },
            
    //		end RFC#7000012672:CD#2000029495:enable Pln  Pick date based on shipment type,IEPre,status			
            
            
            
            editablePlnShipStartDates : function(OverallStatus,IEPreClrStatus) {
                        var enabled = false;
                        if(IEPreClrStatus === "Z001" || IEPreClrStatus === "Z004" || IEPreClrStatus === "Z002" || IEPreClrStatus === "Z003" ){
                        if (OverallStatus === "0" || OverallStatus === "1" || OverallStatus === "5") {
                            enabled = true;
                        }
                        
                        else{
                            enabled = false;
                        }
                        }
                        return enabled;
                    }, 
                    
                    
                        editablePlnArrivalDates : function(OverallStatus,IEPreClrStatus,ActShpmntStartDt,PlanShpmntEndDt) {
                                    var enabled = false;
                                    //make actual date enable 
                                /*	if(PlanShpmntEndDt === null){
                                        ActShpmntStartDt = null;
                                        this.getView().byId("ActCheckInDt").setValue(ActShpmntStartDt);
                                    }*/
                                    
                                    //
                                    if(IEPreClrStatus === "Z001" || IEPreClrStatus === "Z004" || IEPreClrStatus === "Z002" || IEPreClrStatus === "Z003" ){
                                    if (OverallStatus === "0" || OverallStatus === "1" || OverallStatus === "5" || OverallStatus === "6") {
                                        enabled = true;
                                    }
                                    
                                    else{
                                        enabled = false;
                                    }
                                    }
                                    return enabled;
                                }, 
                         
        
            
            editableHAB:function(OverallStatus) {
                var enabled = false;
                //RFC 7000008843
                if (OverallStatus === "0" || OverallStatus === "1" || OverallStatus === "2" || OverallStatus === "5") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
    
                return enabled;
            },
            
            editableActPickDate:function(OverallStatus,ShpmntType,IePreclrStatus,SplProcInd) {
                var enabled = false;
                //start CD - 2000027653: make field editable on below conditions
                if(ShpmntType === "Z006" || ShpmntType === "Z005" ){
                if (OverallStatus === "1" && (IePreclrStatus === "Z004" || IePreclrStatus === "Z001" )) {
                    
    //				Begin of RFC#7000012816:CD#2000029829: add condition for SplProcInd
                    if(ShpmntType === "Z005"){
                        if(SplProcInd === "SLDS"){
                            enabled = true;
                        }
                        else{
                            enabled = false;
                        }
                    }
                    else{
                    enabled = true;
                    }
    //				End of RFC#7000012816:CD#2000029829: add condition for SplProcInd			
                }
                }//end of shipment if
                //end CD - 2000027653
                if(ShpmntType === "Z004"){
                    if (OverallStatus === "0" || OverallStatus === "1" ) {
                        enabled = true;
                    }
                    
                    else{
                        enabled = false;
                    }	
                    
                }
                
                return enabled;
            },
            //end RFC
            
            /*editableActDepDate:function(OverallStatus) {
                var enabled = false;
                if (OverallStatus === "5") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
    
                return enabled;
            },*/
         editableActDepDate:function(OverallStatus,ShpmntType) {
            var enabled = false;
            if(ShpmntType === "Z004"){
                if (OverallStatus === "0" || OverallStatus === "1" || OverallStatus === "5") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
                }
            if(ShpmntType === "Z005" || ShpmntType === "Z006"){
                if (OverallStatus === "5") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
                }
            
            return enabled;
                },
            
            
            editableMasterAirBill:function(OverallStatus) {
                var enabled = false;
                if (OverallStatus === "5" || OverallStatus === "6") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
    
                return enabled;
            },
            
            /*editableActArrDate:function(OverallStatus) {
                var enabled = false;
                if (OverallStatus === "6") {
                    enabled = true;
                }
                
                else{
                    enabled = false;
                }
    
                return enabled;
            },
            */
            editableActArrDate:function(OverallStatus,ShpmntType) {
                var enabled = false;
                
                if(ShpmntType === "Z004"){
                    if (OverallStatus === "0" || OverallStatus === "1" || OverallStatus === "5" || OverallStatus === "6") {
                        enabled = true;
                    }
                    
                    else{
                        enabled = false;
                    }	
                    
                }
                if(ShpmntType === "Z005" || ShpmntType === "Z006" ){
                    if (OverallStatus === "6" ) {
                        enabled = true;
                    }
                    
                    else{
                        enabled = false;
                    }	
                    
                }
    
                return enabled;
            },
            
            
            //-------for displaying true as x
            
            fnChangeText :function (IndShpcostUpdPending){
                var value ;
                if(IndShpcostUpdPending == true ){
                    return	value = "X";
                }
                
                else{
                    return	value = "";
                }
                
                 
            },
            
            fnChangeInvText :function (IndShpinvUpdPending){
                var value ;
                if(IndShpinvUpdPending == true ){
                    return	value = "X";
                }
                
                else{
                    return	value = "";
                }
                
                 
            },
            
            //Function for concatinating string
            concatString : function(val1, val2) {
                return val1 + "-" + val2;
            },
            
            fnChangeDGText :function (IndDangGoods){
                
                var value ;
                if(IndDangGoods == true ){
                    return	value = "X";
                }
                
                else{
                    return	value = "";
                }
                
                 
            },
            
            funObjectStatusShipNum:function(ShipmentNum, flag){
                var state;
                if (flag == "S"){
                    state = "Success";
                }
                if(flag == "N"){
                    state = "None";
                }
                if(flag =="E"){
                    state = "Error";
                }
                return state;
            },
            //function to handle visibility of Planned CheckIn Date
            fnVisibilityIndicatorPlnChkIn:function(PlanShpmntComplDt,IePreclrStatus){
                var visible = true;
                if(PlanShpmntComplDt === null ){
                      visible = false;
                }
                if(IePreclrStatus === "Z002" || IePreclrStatus === "Z003"){
                      visible = false;
                } 
                return visible;
         },
    
            
            //function to handle visibility of Planned Departure Date
            fnVisibilityIndicatorPlanShmntStartDt:function(PlanShpmntStartDt){
                var visible = true;
                if(PlanShpmntStartDt === null ){
                    visible = false;
                }
                return visible;
            },
            
            //function to handle visibility of Planned Arrival date
            fnVisibilityIndicatorPlanShpmntEndDt:function(PlanShpmntEndDt){
                var visible = true;
                if(PlanShpmntEndDt === null ){
                    visible = false;
                }
                return visible;
            },
            //Function for Cost/Invoice button viibility
            funCstInvIndVis:function(IndNoShpmntCost, IndNoShpmntInv){
                var state;
                if(IndNoShpmntCost && IndNoShpmntInv){
                    state = false;
                }
                else{
                    state = true;
                }
                return state;
            },
            //function for FA Tracking ID Indicator
            funFATrackbtn : function(TndrTrkid){
                var state;
                if(TndrTrkid !== ""){
                    state = true;
                }
                else{
                    state = false;
                }
                return state;
            },
            
            //Function for Cost/Invoice Indicator type 
            funCstInvIndType:function(IndNoShpmntCost, IndNoShpmntInv){
                var state;
                if(IndNoShpmntCost === "" && IndNoShpmntInv ==="X"){
                    state ="Default";
                }
                
                if(IndNoShpmntInv === "" && IndNoShpmntCost ==="X"){
                    state = "Accept";
                }
                return state;
                
            },
    
    
            fnEditable :function (unit){
                var value ;
                if(unit == "" ){
                    return	value = true;
                }
                
                else{
                    return	value = false ;
                }
            },
            
            fnAdjustTimeZoneDiff: function(inpDate){
                if(inpDate){
                    var timeZoneOffset = inpDate.getTimezoneOffset()*60*1000;
                    var y = inpDate.getTime() - timeZoneOffset;
                    inpDate = new Date(y);
                        
                }
                return inpDate;
            },
        //make cost screen's acc code row editable based on cost type	
            editableCostRow:function(CostType) {
                var enabled = true;
                if (CostType === "W") {
                    enabled = false;
                }
                
                else{
                    enabled = true;
                }
    
                return enabled;
            },
            //make Invoice screen's acc code row editable based on cost type and voucher id
            editableInvRow:function(CostType,voucherId) {
                var enabled = true;
                if(voucherId){
                    enabled = false;
                }
                else if(!voucherId){
                    if(CostType === "F" || CostType === undefined){
                        enabled = true;
                    }
                    else{
                        enabled = false;
                    }
                }
                
                return enabled;
            },
            
            //make planned date as mindate #2000025529
            
            editableEndDate:function(ShpmntType,OverallStatus) {
                var enabled = false;
                if(ShpmntType === "Z004" && OverallStatus ==="0"){
                    enabled = true;
                }
                else{
                    enabled = false;
                }
                return enabled;
            
    
        },
            
        //make current date as min date	
            setMinDate:function(PlanShpmntComplDt){
                var date;
                if(PlanShpmntComplDt !== "" && PlanShpmntComplDt !== null){	//12091993
    //				date=new Date(this.getView().byId("PlanCheckInDt").getValue());
                    return PlanShpmntComplDt;
                }
                else{
                    date=new Date();
                    return date;
                }
            },
        
            //to visible end date on header table
        fnVisibleEndDt :function (ShpmntType,OverallStatus){
            var visible = false;
            if((OverallStatus === "0") && ShpmntType === "Z004"){
                visible = true;
            }
            return visible;
        },
        
            
            
            
            
    
        };
    
    },/* bExport= */true);