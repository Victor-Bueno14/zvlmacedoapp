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
            var oView = this.getView(),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("TargetDetailNotFound");
                // if object could not be found, the selection in the list
                // does not make sense anymore.
                this.getOwnerComponent().oListSelector.clearListListSelection();
                return;
            }

            var sPath = oElementBinding.getPath(),
                oResourceBundle = this.getResourceBundle(),
                oObject = oView.getModel().getObject(sPath),
                sObjectId = oObject.Carrid,
                sObjectName = oObject.Carrname,
                oViewModel = this.getModel("detailView");

            this.getOwnerComponent().oListSelector.selectAListItem(sPath);

            oViewModel.setProperty("/shareSendEmailSubject",
                oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
            oViewModel.setProperty("/shareSendEmailMessage",
                oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
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
        },

        onEditCompanyBtnPress: function () {
            const oEditModel = this.getView().getModel("editCompanyModel");
            
            oEditModel.setProperty("/isNew", false);

            if(!this.oDialogEditCompany) {
                this.oDialogEditCompany = Fragment.load({
                    id: this.getView().getId(),
                    name: "moovi.zvlmacedoapp.view.EditCompanyDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    this.oDialogEditCompany = oDialog;
                    this.oDialogEditCompany.open()
                }.bind(this));
            } else {
                this.oDialogEditCompany.open();
            };
        },

        onSaveCompanyButtonPress: function (oEvent) {
            const oModel = this.getView().getModel();

            oModel.submitChanges({
                success: this.handleSuccessSave.bind(this),
                error: this.handleSaveError.bind(this)
            });
        },

        onCancelNewCompany: function (oEvent) {
            const oModel = this.getView().getModel();
            
            oModel.resetChanges();

            this.oDialogEditCompany.close();
        },

        onBtnDeletePress: function (oEvent) {
            const oModel = this.getView().getModel(),
                  oContext = this.getView().getBindingContext(),
                  that = this;

            MessageBox.warning(
                "O registro será excluído! Deseja continuar?",
                {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function (sAction) {
                        if(sAction == MessageBox.Action.OK) {
                            oModel.remove(oContext.getPath(), {
                                success: that.handleSuccessDelete.bind(that),
                                error: that.handleErrorDelete.bind(that)
                            });
                        };
                    }
                }
            );
        },

        handleSuccessSave: function (oRes, oData) {
            const oModel =  this.getView().getModel();

            if(oRes.__batchResponses) {
                if(oRes.__batchResponses[0].response) {
                    const iStatus = parseInt(oRes.__batchResponses.response.statusCode)

                    if (iStatus >= 400) {
                        const oResponseBody = JSON.parse(oRes.__batchResponses[0].response.body);

                        oModel.resetChanges();

                        oModel.refresh();
                    } else {
                        MessageToast.show("Salvo com sucesso!");

                        this.oDialogEditCompany.close();
                    };
                } else if (oRes.__batchResponses[0].__changeResponses) {
                    const aChangeRes = oRes.__batchResponses[0].__changeResponses;

                    const iStatus = parseInt(aChangeRes[0].statusCode);

                    if (iStatus >= 400) {
                        MessageBox.alert("Erro ao salvar!");
                        
                        oModel.resetChanges();

                        oModel.refresh();
                    } else {
                        MessageToast.show("Salvo com sucesso!");

                        this.oDialogEditCompany.close();
                    }
                }
            } else {
                MessageToast.show("Salvo com sucesso!");

                this.oDialogEditCompany.close();
            };
        },

        handleSaveError: function (oError) {
            if (oError) {
                if (oError.responseText) {
                    const oErrorMessage = JSON.parse(oError.responseText);

                    MessageBox.alert(oErrorMessage.error.message.value);
                };
            };
        },

        handleSuccessDelete: function (oRes) {
            MessageToast.show("Registro excluído com sucesso!");

            this.oDialogEditCompany.close();
        },
        
        handleErrorDelete: function (oError) {
            if (oError) {
                if (oError.responseText) {
                    const oErrorMessage = JSON.parse(oError.responseText);
                    
                    MessageBox.alert(oErrorMessage.error.message.value);
                };
            };
        },

        onListItemPressed: function (oEvent) {
            const oItem = oEvent.getSource();
            
            const oCtx  = oItem.getBindingContext();

            this.getRouter().navTo("RouteFlight", {
                Carrid: oCtx.getProperty("Carrid"),
                Connid: oCtx.getProperty("Connid")
            });
        },

        onBtnCreatePress: function (oEvent) {
            const oView = this.getView();

            const oCtx = oView.getBindingContext();

            this.getRouter().navTo("RouteFlight", {
                Carrid: oCtx.getProperty("Carrid"),
                Connid: "New"
            });
        }
    });
});