define([], function () {
    return {

        currSelectionsFormula: "=GetCurrentSelections(Chr(10),',',',',60)",
		styles:{ 
			//  highlightCurrSheet: "background-color: #dedede;"
		},


        sampleMenu: [{
            "menu": "IPS Claims",
            "id": 0,
            "link": "82305aaa-1095-4655-8b0b-e9ce8d0109b7"
        }, {
            "menu": "Worldview Dashboard",
            "id": 1,
            "link": "ae23f4e9-c7d0-4aa3-a66c-b7c39e394d51"
        }, {
            "menu": "Claims Overview",
            "id": 2,
            "link": "54871c29-bfbb-4115-9981-3e01f1e2c066"
        }, {
            "menu": "Type of Loss",
            "id": 3,
            "children": [{
                "menu": "Type of Loss overview Motor",
                "link": "0d084b03-258b-4b3c-8f65-b76c96222bfe"
            }, {
                "menu": "Type of Loss overview Liability",
                "link": "123"
            }, {
                "menu": "Type of Loss overview Non-Motor",
                "link": "ff72dda1-fa8b-4ef8-a0b8-817d25182a77"
            }]
        }, {
            "menu": "Financials",
            "id": 4,
            "children": [{
                "menu": "Financial claims overview",
                "link": "9f2bc1af-b793-48a4-b45a-088512f7ad97"
            }, {
                "menu": "Quarterly Bookings",
                "link": "123"
            }]
        }, {
            "menu": "Download",
            "id": 5,
            "children": [{
                "menu": "Reports",
                "link": "792aafd4-b64f-4511-9454-d975f69de54f"
            }, {
                "menu": "Overview",
                "link": "c331f927-13f2-4e9c-9c41-e143d1cb96eb"
            }]
        }]
    };
});        