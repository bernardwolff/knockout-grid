var rowViewModel = function (row) {
    var self = ko.mapping.fromJS(row);

    self.isSaving = ko.observable(false);
    self.editing = ko.observable(false);

    self.beginEdit = function () {
        self.editing(true);
    }

    return self;
}

var columnViewModel = function(gridVm, label, propertyName, sortable, sortDirection, templateName, editable) {
    var self = this;
    self.label = label;
    self.propertyName = propertyName;
    self.sortable = sortable;
    self.sortDirection = ko.observable(sortDirection);
    self.templateName = templateName;
    self.editable = editable;

    self.save = function(rowVm) {
        var next = function () {
            rowVm.isSaving(false);
            rowVm.editing(false);
        };
        var err = function (msg) {
            rowVm.isSaving(false);
            rowVm.editing(false);
            toastr.error(msg);
        }
        rowVm.isSaving(true);
        gridVm.save(rowVm, next, err);
    }

    self.filter = ko.observable("");
    self.enteredFilter = ko.observable("");
    self.filterVisible = ko.observable(false);
    self.enteredMatchType = ko.observable("exact");
    self.filterMatchType = ko.observable("exact");

    self.filterClick = function() {
        self.filterVisible(!self.filterVisible());
        self.filterTextFocus(self.filterVisible());
    }

    self.filterTextFocus = ko.observable(false);

    self.filterEntered = function () {
        if (event.keyCode === 13) {
            self.filterTextFocus(false);
            self.filterVisible(false);
            self.filterMatchType(self.enteredMatchType());
            self.filter(self.enteredFilter());
        }
        return true;
    }

    self.clearFilter = function () {
        self.enteredFilter("");
        self.filterTextFocus(true);
    }

    self.clearFilterAndApply = function () {
        self.enteredFilter("");
        self.filter(self.enteredFilter());
    }

    self.applyFilter = function() {
        self.filterVisible(false);
        self.filterMatchType(self.enteredMatchType());
        self.filter(self.enteredFilter());
        if (self.enteredFilter()) self.gridVm.filtered(true);
    }

    self.cancelFilter = function () {
        self.filterVisible(false);
    }

    self.isAscending = ko.computed(function() {
        return self.sortDirection() === 'Ascending';
    });

    self.isDescending = ko.computed(function () {
        return self.sortDirection() === 'Descending';
    });

    self.gridVm = gridVm;

    self.headerClick = function() {
        self.sortDirection(self.sortDirection() === 'Ascending' ? 'Descending' : 'Ascending');
        self.gridVm.sort();
    }

    return self;
}

var gridViewModel = function(columns, retrieveDataFunc, saveRowFunc) {
    var self = this;

    self.isLoading = ko.observable(true);
    self.hasData = ko.observable(false);
    self.sorted = ko.observable(false);
    self.filtered = ko.observable(false);
    self.pageSize = ko.observable(30);
    self.currentPage = ko.observable(1);
    // click to select a page
    self.showPagination = ko.observable(false);
    // type in current page number
    self.showPager = ko.observable(true);

    self.startIndex = ko.computed(function () {
        return (self.currentPage() - 1) * self.pageSize();
    });

    self.endIndex = ko.computed(function () {
        return self.startIndex() + Number(self.pageSize());
    });

    self.columns = ko.observableArray(columns.map(function (column) {
        return new columnViewModel(self, column.label, column.propertyName, column.sortable, column.sortDirection, column.templateName, column.editable);
    }));

    self.rowItems = ko.observableArray([]);

    self.filteredData = ko.computed(function () {
        self.isLoading(true);
        var filteredData = ko.utils.arrayFilter(self.rowItems(), function (item) {
            var include = true;
            ko.utils.arrayForEach(self.columns(), function (column) {
                if (!include || !column.filter() || column.filter() === "") return;
                if (column.filterMatchType() === "exact") {
                    include = include && item[column.propertyName]().toString().toLowerCase() === column.filter().toLowerCase();
                } else {
                    include = include && item[column.propertyName]().toString().toLowerCase().indexOf(column.filter().toLowerCase()) > -1;
                }
            });
            return include;
        });
        if (filteredData.length < self.rowItems().length) self.currentPage(1);
        self.isLoading(false);
        return filteredData;
    });

    self.save = function (rowVm, next, err) {
        saveRowFunc(ko.mapping.toJS(rowVm), next, err);
    }

    self.currentPageData = ko.computed(function() {
        return self.filteredData().slice(self.startIndex(), self.startIndex() + Number(self.pageSize()));
    });

    self.populateData = function () {
        self.isLoading(true);

        retrieveDataFunc(function(data) {
                if (data) {
                    self.rowItems([]);
                    self.rowItems(data.map(function (item) {
                        return rowViewModel(item);
                    }));
                    ko.utils.arrayForEach(self.columns(), function(column) {
                        if (column.sortDirection()) self.sorted(true);
                    });
                    if (self.sorted()) self.sort();
                }
                self.isLoading(false);
                self.hasData(true);
            },
            function(msg) {
                toastr.error(msg);
            });
    }

    self.sort = function () {
        self.sorted(true);
        self.rowItems.sort(function (a, b) {
            for (var i = 0; i < self.columns().length; i++) {
                var col = self.columns()[i];
                if (col.sortDirection()) {
                    var dir = col.sortDirection() === 'Ascending' ? 1 : -1;

                    if (a[col.propertyName]() < b[col.propertyName]())
                        return -1 * dir;
                    else if (a[col.propertyName]() > b[col.propertyName]())
                        return +1 * dir;
                }
            }

            return 0;
        });
    };

    self.clearSort = function () {
        self.sorted(false);
        ko.utils.arrayForEach(self.columns(), function (col) {
            col.sortDirection(null);
        });
    }

    self.clearAllFilters = function () {
        self.filtered(false);
        ko.utils.arrayForEach(self.columns(), function (col) {
            col.clearFilterAndApply();
        });
    }

    self.totalPages = ko.computed(function () {
        return Math.ceil(self.filteredData().length / self.pageSize());
    });

    self.onFirstPage = ko.computed(function () {
        // needs to be double equals because currentPage is an observable updated from a text input
        return self.currentPage() == 1;
    });

    self.onLastPage = ko.computed(function () {
        return self.currentPage() == self.totalPages();
    });

    self.previousPage = function () {
        var newPage = self.currentPage() - 1;
        if (newPage < 1) return;
        self.currentPage(newPage);
    }

    self.nextPage = function () {
        var newPage = Number(self.currentPage()) + 1;
        if (newPage > self.totalPages()) return;
        self.currentPage(newPage);
    }

    self.setPage = function (page) {
        self.currentPage(page);
    }

    self.pageSize.subscribe(function (newValue) {
        self.currentPage(1);
    });

    self.init = function () {
        self.populateData();
    };

    return self;
};
