sap.ui.define([
    "moovi/zvlmacedoapp/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, mobileLibrary, Fragment, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("moovi.zvlmacedoapp.controller.FlightDetail", {
        formatter: formatter,

        onInit: function () {
            const oRouter = this.getRouter();

            oRouter.getRoute("RouteFlight").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sCarrid = oEvent.getParameter("arguments").Carrid,
                  sConnid = oEvent.getParameter("arguments").Connid,
                  oView   = this.getView();

            const oEditModel = this.getView().getModel("editFlightModel");

            oEditModel.setProperty("/isNew", false);

            if (sConnid !== "New"){
                const sObjectPath = this.getModel().createKey("SpfliSet", {
                    Carrid: sCarrid,
                    Connid: sConnid
                });

                oView.bindElement({
                    path: "/" + sObjectPath,
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function (oEvent) {
                            oView.setBusy(true);
                        },
                        dataReceived: function (oEvent) {
                            oView.setBusy(false);
                        }
                    }
                });
            } else {
                this._initNewFlight(sCarrid);
            };
        },

        _initNewFlight: function (sCarrid) {
            const oEditModel = this.getView().getModel("editFlightModel");

            oEditModel.setProperty("/isNew", true);

            const oModel = this.getView().getModel();

            oModel.setDeferredGroups(["createFlightId"]);

            oModel.setChangeGroups({
                "SpfliSet": {
                    groupId: "createFlightId",
                    changeSetId: "ID"
                }
            });

            const oContext = oModel.createEntry("/SpfliSet", {
                groupId: "createFlightId",
                properties: { Carrid: sCarrid}
            });

            this.getView().bindElement(oContext.getPath());
        },

        _onBindingChange: function (oEvent) {
            if(!this.getView().getBindingContext()) {
                this.getRouter().getTargets().display("notFound");
            }
        },

        onBtnSavePress: function (oEvent) {
            const oModel = this.getView().getModel();

            oModel.submitChanges({
                success: this.handleSuccessSave.bind(this),
                error: this.handleSaveError.bind(this)
            });
        },

        onBtnDeletePress: function (oEvent) {
            const oModel = this.getView().getModel(),
                  oContext = this.getView().getBindingContext(),
                  that = this;

            MessageBox.warning(
                "O registro será excluído! Deseja continuar?",
                {
                    action: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function (sAction) {
                        if (sAction) {
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
            var oModel = this.getView().getModel();

            if (oRes.__batchResponses) {
                if (oRes.__batchResponses[0].response) {
                    var status = parseInt(oRes.__batchResponses[0].response.statusCode);

                    if (status >= 400) {
                        var oResponseBody = JSON.parse(oRes.__batchResponses[0].response.body);

                        MessageBox.alert("Erro ao Salvar. ERRO:" + oResponseBody.error.message.value);

                        oModel.resetChanges();

                        oModel.refresh();

                    } else {
                        MessageToast.show("Salvo com sucesso!");

                        this.onNavBack();

                    }
                } else if (oRes.__batchResponses[0].__changeResponses) {
                    var aChangeRes = oRes.__batchResponses[0].__changeResponses;

                    var status = parseInt(aChangeRes[0].statusCode);

                    if (status >= 400) {
                        MessageBox.alert("Erro ao Salvar");

                        oModel.resetChanges();

                        oModel.refresh();

                    } else {
                        MessageToast.show("Salvo com sucesso!");

                        this.onNavBack();

                    };

                }
            } else {
                MessageToast.show("Salvo com sucesso!");

                this.onNavBack();

            };
        },

        handleSaveError: function (oError) {
            if (oError) {
                if (oError.responseText) {
                    var oErrorMessage = JSON.parse(oError.responseText);

                    MessageBox.alert(oErrorMessage.error.message.value);
                };
            };
        },


        handleSuccessDelete: function (oRes) {
            MessageToast.show("Registro Excluído com sucesso!");

            this.onNavBack();
        },

        handleErrorDelete: function (oError) {
            if (oError) {
                if (oError.responseText) {
                    var oErrorMessage = JSON.parse(oError.responseText);

                    MessageBox.alert(oErrorMessage.error.message.value);
                };
            };
        }        
    });
});