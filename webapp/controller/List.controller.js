sap.ui.define([
    "moovi/zvlmacedoapp/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/m/GroupHeaderListItem",
    "sap/ui/Device",
    "sap/ui/core/Fragment",
    "../model/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, 
            GroupHeaderListItem, Device, Fragment, formatter, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("moovi.zvlmacedoapp.controller.List", {

        formatter: formatter,

        onInit: function () {
            const oList = this.byId("list"),
                  oViewModel = this._createViewModel(),
                  iOriginalBusyDelay = oList.getBusyIndicatorDelay();

            this._oList = oList;

            this._oListFilterState = {
                aFilter: [],
                aSearch: []
            };
            
            this.setModel(oViewModel, "listView");

            oList.attachEventOnce("updateFinished", function () {
                oViewModel.setProperty("/delay", iOriginalBusyDelay);
            });

            this.getView().addEventDelegate({
                onBeforeFirstShow: function() {
                    this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
                }.bind(this)
            });

            this.getRouter().getRoute("RouteList").attachPatternMatched(this._onMasterMatched, this);
            this.getRouter().attachBypassed(this.onBypassed, this);
        },

        onUpdateFinished: function (oEvent) {
            this._updateListItemCount(oEvent.getParameter("total"));
        },

        onSearch: function (oEvent) {
            if (oEvent.getParameter().refreshButtonPressed) {
                this.onRefresh();
                return;
            };

            const sQuery = oEvent.getPramaeter("query");

            if (sQuery) {
                this._oListFilterState.aSearch = [new Filter("Carrname", FilterOperator.Contains, sQuery)]
            } else {
                this._oListFilterState.aSearch = [];
            };

            this._applyFilterSearch();
        },

        onRefresh: function () {
            this._oList.getBinding("items").refresh();
        },

        onOpenViewSettings: function (oEvent) {
            let sDialogTab = "Filter";

            if (oEvent.getSource() instanceof sap.m.Button) {
                const sButtonId = oEvent.getSource().getId();
                if (sButtonId.match("sort")) {
                    sDialogTab = "sort";
                } else if (sButtonId.match("group")) {
                    sDialogTab = "group";
                };
            };

           if (!this.byId("viewSettingsDialog")) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "moovi.zvlmacedoapp.view.ViewSettingsDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    oDialog.open(sDialogTab);
                }.bind(this));
           } else {
                this.byId("viewSettingsDialog").open(sDialogTab);
           }
        },

        onConfirmViewSettingsDialog: function (oEvent) {
            this._applySortGroup(oEvent);
        },

        _applySortGroup: function (oEvent) {
            let mParams = oEvent.getParameters(),
                sPath,
                bDescending,
                aSorters = [];

            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));
            this._oList.getBinding("items").sort(aSorters);
        },

        onSelectionChange: function (oEvent) {
            const oList = oEvent.getSource(),
                  bSelected = oEvent.getParameter("selected");

            if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
                this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
            };
        },

        onBypassed: function () {
            this._oList.removeSelections(true);
        },

        createGroupHeader: function (oGroup) {
            return new GroupHeaderListItem({
                title: oGroup.text,
                upperCase: false
            });
        },

        onNavBack: function () {
            history.go(-1);
        },

        _createViewModel: function () {
            return new JSONModel({
                isFilterBarVisible: false,
                filterBarLabel: "",
                delay: 0,
                title: this.getResourceBundle().getText("listTitleCount", [0]),
                noDataText: this.getResourceBundle().getText("listListNoDataText"),
                sortBy: "Carrname",
                gropBy: "None"
            });
        },

        _onMasterMatched: function () {
            this.getModel("appView").setProperty("/layout", "OneColumn");
        },

        _showDetail: function (oItem) {
            let bReplace = !Device.system.phone;

            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getRouter().navTo("RouteObject", {
                objectId: oItem.getBindingContext().getProperty("Carrid")
            }, bReplace);
        },

        _updateListItemCount: function (iTotalItems) {
            let sTitle;

            if (this._oList.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("listTitleCount", [iTotalItems]);
                this.getModel("listView").setProperty("/title", sTitle);
            };
        },

        _applyFilterSearch: function () {
            const aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
                  oViewModel = this.getModel("listView");

            this._oList.getBinding("items").filter(aFilters, "Application");

            if (aFilters.length !== 0) {
                oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("listListNoDataWithFilterOrSearchhText"));
            } else if (this._oListFilterState.aSearch.length > 0) {
                oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("listListNoDataText"));
            };
        },

        _updateFilterBar: function (sFilterBarText) {
            const oViewModel = this.getModel("listView");
            oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
            oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("listFilterBarText", [sFilterBarText]));
        }
    });
});
