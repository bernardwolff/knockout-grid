var columnDefinition = [
{ label: 'Site Name', propertyName: 'SiteName', sortable: true, sortDirection: 'Ascending' },
{ label: 'Site ID', propertyName: 'SiteID', sortable: true },
{ label: 'School Name', propertyName: 'SchoolName', sortable: true, sortDirection: 'Ascending' },
{ label: 'School ID', propertyName: 'ID', sortable: true },
{ label: 'Instances', propertyName: 'Instances', sortable: false, sortDirection: null, templateName: 'instance-template' },
{ label: 'Notes', propertyName: 'Notes', sortable: false, editable: true },
{ label: 'Networks', propertyName: 'Networks', sortable: false, sortDirection: null, templateName: 'network-template' }
];

document.addEventListener("DOMContentLoaded", function(event) { 
  $.get("grid-template.html", function(template) {
    $('body').append('<script type="text/html" id="grid-template">' + template + "</script>");

    var getData = function mockRetrieveDataFunction(next, err) {
      setTimeout(function(){
        next(allSchools)
      }, 1000)
    };
    var saveData = function mockSaveDataFunction(data, next, err) {
      setTimeout(next, 800)
    };
    var gridVm = new gridViewModel(columnDefinition, getData, saveData);
    gridVm.init();

    ko.applyBindings(gridVm, document.getElementById("grid"));
  });

});
