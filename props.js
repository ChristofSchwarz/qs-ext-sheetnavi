define(['./functions'], function (functions) {


    function subSection(labelText, itemsArray, argKey, argVal) {
        var ret = {
            component: 'expandable-items',
            items: {}
        };
        var hash = 0;
        for (var j = 0; j < labelText.length; j++) {
            hash = ((hash << 5) - hash) + labelText.charCodeAt(j)
            hash |= 0;
        }
        ret.items[hash] = {
            label: labelText,
            type: 'items',
            show: function (arg) { return (argKey && argVal) ? (arg[argKey] == argVal) : true },
            items: itemsArray
        };
        return ret;
    }

    return {
        presentation: function () {
            return [{
                label: function (data) { return 'Navigation bar padding: ' + data.pHeight },
                type: 'integer',
                component: 'slider',
                ref: 'pHeight',
                min: 1,
                max: 12,
                step: 1,
                defaultValue: 8

            }, {
                label: 'Menu orientation',
                type: 'string',
                component: 'buttongroup',
                defaultValue: 'h',
                ref: 'pAlignment',
                options: [{
                    value: 'h',
                    label: 'horizontal'
                }, {
                    value: 'v',
                    label: 'vertical'
                }]
            }, {
                label: function (data) { return 'Font-size: ' + data.pFontsize + 'pt' },
                type: 'integer',
                component: 'slider',
                ref: 'pFontsize',
                min: 5,
                max: 20,
                step: 1,
                defaultValue: 10

            }, {
                label: 'Hide Sheet Title in Sense Client',
                type: 'boolean',
                defaultValue: false,
                ref: 'pHideTitle'
            }, {
                label: 'Set Qlik Variables with Sheet/Tag info',
                type: 'boolean',
                defaultValue: false,
                ref: 'pSetQlikVars'
            }, {
                label: "If you turn this on, 3 variables will be updated with the list of sheets, "
                    + 'tags a matrix of the both: vViewSheetsDim, vViewTagsDim, vViewSheetTag',
                component: "text"
            }, {
                label: 'Show Zurich Button',
                type: 'boolean',
                defaultValue: false,
                ref: 'pShowZurichBtn'
            }, 
            subSection('Color Settings', [
                {
                    label: "Menu Text Color",
                    component: "color-picker",
                    ref: "pMenuTxtCol",
                    type: "object",
                    //dualOutput: true,
                    defaultValue: { index: -1, color: "#333333" }
                }, {
                    label: "Menu Background Color",
                    component: "color-picker",
                    ref: "pMenuBgCol",
                    type: "object",
                    //dualOutput: true,
                    defaultValue: { index: -1, color: "#ffffff" }
                }, {
                    label: "Highlight Text Color",
                    component: "color-picker",
                    ref: "pHighlightTxtCol",
                    type: "object",
                    //dualOutput: true,
                    defaultValue: { index: -1, color: "#1e1e1f" }
                }, {
                    label: "Highlight Background Color",
                    component: "color-picker",
                    ref: "pHighlightBgCol",
                    type: "object",
                    //dualOutput: true,
                    defaultValue: { index: -1, color: "#dedede" }
                }, {
                    label: "Color of submenu twistie",
                    component: "color-picker",
                    ref: "pTwistieCol",
                    type: "object",
                    //dualOutput: true,
                    defaultValue: { index: -1, color: "#0000fe" }
                }, {
                    label: "Color of Menu line",
                    component: "color-picker",
                    ref: "pLineCol",
                    type: "object",
                    //dualOutput: true,
                    defaultValue: { index: -1, color: "#ddeddd" }
                }
            ]), subSection('Single Mode Settings', [
                {
                    label: 'Show Logout Button in Single Mode',
                    type: 'boolean',
                    defaultValue: false,
                    ref: 'pShowLogout'
                }, {
                    label: 'Additional query-strings in single-mode',
                    type: 'string',
                    defaultValue: {
                        qStringExpression: {
                            qExpr: "='select=%25ReportingCurrency,' & [%ReportingCurrency]"
                        }
                    },
                    expression: 'optional',
                    ref: 'pMoreQueryStrings'
                }
            ])
            ]
        },

        exportApp: function () {
            return [{
                label: 'More customers (dropdown)',
                type: 'string',
                defaultValue: 'Richemont,ABB',
                ref: 'pMoreCustomers'
            }, {
                label: "comma-separated list; customers mentioned in sheet description {tags} will be shown"
                    + " automatically",
                component: "text"
            }, {
                label: 'Url GCA Hub SIT',
                type: 'string',
                defaultValue: 'https://ci-reporting-dev-myzurich.zurich.com/extensions/databridge/hub.html?from=file&importdesign&importscript&stream=ad61b9f3-6c46-4669-be59-4b4718badc17',
                ref: 'pHubSIT'
            }, {
                label: 'Test url',
                component: 'link',
                url: function (layout) { return layout.pHubSIT }
            }, {
                label: 'Url GCA Hub UAT',
                type: 'string',
                defaultValue: 'https://ci-reporting-uat-myzurich.zurich.com/extensions/databridge/hub.html?from=file&importdesign&importscript&stream=48f57b12-7ffa-4fe5-b518-fa94a78d4325',
                ref: 'pHubUAT'
            }, {
                label: 'Test url',
                component: 'link',
                url: function (layout) { return layout.pHubUAT }
            }, {
                label: 'Url GCA Hub Prod',
                type: 'string',
                defaultValue: 'https://ci-reporting-myzurich.zurich.com/extensions/databridge/hub.html?from=file&importdesign&importscript&stream=41388fe6-bdbb-4b22-8188-0517efe19559',
                ref: 'pHubProd'
            }, {
                label: 'Test url',
                component: 'link',
                url: function (layout) { return layout.pHubProd }
            }]
        },

        about: function () {
            return {
                // version: {
                //     label: 'version',
                //     component: "text"
                // },
                txt1: {
                    label: "This menubar extension was written by data/\\bridge.",
                    component: "text"
                },
                btn: {
                    label: "About data/\\bridge",
                    component: "link",
                    url: 'https://www.databridge.ch'
                }
            }
        }
    }

});