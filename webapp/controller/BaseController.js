sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    return Controller.extend("moovi.zvlmacedoapp.controller.BaseController", {
        /**
         * Convenience method for acessing the router in every controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} 'sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * @public
         * @param {sap.ui.model.Model} 'oModel the model instance
         * @param {string} 'sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */

        setModel: function (oModel, sName){
            return this.getView().setModel(oModel, sName);
        },

        /** Convenience method for getting the resource bundle
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
        */

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /** 
         * Event handler for navegating back.
         * If there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the list route.
         * @public
         */

        onNavBack: function () {
            const sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                // eslint-disabel-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("list", {}, true);
            }
        }
    });
});