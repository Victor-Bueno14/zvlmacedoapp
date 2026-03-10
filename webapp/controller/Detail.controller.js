sap.ui.define([
    "moovi/zvlmacedoapp/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseControler, JSONModel, formatter, mobileLibraty,
             Fragment, MessageToast, MessageBox) {
    "use strict";

    var URLHelper = mobileLibraty.URLHelper;

    return BaseControler.extend("moovi.zvlmacedoapp.controller.Detail", {

        formatter: formatter,

        onInit: function () {
            const oViewModel = new JSONModel({
                busy: false,
                delay: 0,
                lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
            });

            this.getRouter().getRoute("RouteObject").attachPatternMatched(this._onObjectMatched, this);

            this.setModel(oViewModel, "detailView");

            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
        },

        onSendEmailPress: function () {
            const oViewModel = this.getModel("detailView");

            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },
        
        onListUpdateFinished: function (oEvent) {
            let sTitle;

            const iTotalItems = oEvent.getParameter("total"),
                  oViewModel = this.getModel("detailView");

            if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
                if (iTotalItems) {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
                } else {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
                };

                oViewModel.setProperty("/lineItemListTitle", sTitle);
            };
        },

        _onObjectMatched: function (oEvent) {
            const sObjectId = oEvent.getParameter("arguments").objectId;

            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

            this.getModel().metadataLoaded().then(function () {
                const sObjectPath = this.getModel().createKey("ScarrSet", {
                    Carrid: sObjectId
                });
                this._bindView("/" + sObjectPath)
            }.bind(this));
        },

        _bindView: function (sObjectPath) {
            const oViewModel = this.getModel("detailView");

            oViewModel.setProperty("/busy", false);

            this.getView().bindElement({
                path: sObjectPath,
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function() {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function() {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },

        _onBindingChange: function () {
            const oView = this.getView(),
                  oElementBinding = oView.getElementBinding();
            
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("TargetDetailNotFound");
                this.getOwnerComponent().oListSelector.clearMasterListSelection();
                return;
            }

            const sPath = oElementBinding.getPath(),
                  oResourceBundle = this.getResourceBundle(),
                  oObject = oView.getModel().getObject(sPath),
                  sObjectId = oObject.Carrid,
                  sObjectName = oObject.Carrname,
                  oViewModel = this.getModel("detailView");

            this.getOwnerComponent().oListSelector.selectAListItem(sPath);

            oViewModel.setProperty("/shareSendEmailSubject",
                oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId])
            );

            oViewModel.setProperty("/shareSendEmailMessage",
                oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href])
            );
        },

        _onMetadataLoaded: function () {
            const iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
                  oViewModel = this.getModel("detailView"),
                  oLineItemTable = this.byId("lineItemsList"),
                  iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
            
            oViewModel.setProperty("/delay", 0);
            oViewModel.setProperty("/lineItemTableDelay", 0);

            oLineItemTable.attachEventOnce("updateFinished", function () {
                oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
            });

            oViewModel.setProperty("/busy", true);
            oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
        },

        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);   
            this.getRouter().navTo("RouteList");
        },

        toggleFullScreen: function () {
            const bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");

            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
            } else {
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            };            
        }
    })
})