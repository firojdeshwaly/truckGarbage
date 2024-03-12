$(document).ready(() => {
  $("#pages-datatable").DataTable({
    aoColumnDefs: [
      {
        bSortable: false,
        aTargets: [-1],
      },
    ],
    stateSave: true,
    searchDelay: 700,
    aaSorting: [[0, "desc"]],
    processing: true,
    serverSide: true,
    ajax: {
      url: "/pages/list",
      data: {},
    },
    initComplete: (settings, json) => {
      $(".tableLoader").css("display", "none");
    },
    language: {
      paginate: {
        previous: '<i class="mdi mdi-chevron-left">',
        next: '<i class="mdi mdi-chevron-right">',
      },
    },
    drawCallback: () => {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
    },
  });
  $("#vehicle-datatable").DataTable({
    aoColumnDefs: [
      {
        defaultContent: "-",
        targets: "_all",
      },
    ],
    stateSave: true,
    searchDelay: 700,
    aaSorting: [[0, "desc"]],
    processing: true,
    serverSide: true,
    ajax: {
      url: "/vehicle/list",
      data: {},
    },
    initComplete: (settings, json) => {
      $(".tableLoader").css("display", "none");
    },
    language: {
      paginate: {
        previous: '<i class="ion-arrow-left-a">',
        next: '<i class="ion-arrow-right-a">',
      },
    },
    drawCallback: () => {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
    },
  });
  $("#request-datatable").DataTable({
    aoColumnDefs: [
      {
        defaultContent: "-",
        targets: "_all",
      },
    ],
    stateSave: true,
    searchDelay: 700,
    aaSorting: [[0, "desc"]],
    processing: true,
    serverSide: true,
    ajax: {
      url: "/requests/list",
      data: {},
    },
    initComplete: (settings, json) => {
      $(".tableLoader").css("display", "none");
    },
    language: {
      paginate: {
        previous: '<i class="ion-arrow-left-a">',
        next: '<i class="ion-arrow-right-a">',
      },
    },
    drawCallback: () => {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
    },
  });
  $("#users-datatable").DataTable({
    aoColumnDefs: [
      {
        defaultContent: "-",
        targets: "_all",
      },
    ],
    stateSave: true,
    searchDelay: 700,
    aaSorting: [[0, "desc"]],
    processing: true,
    serverSide: true,
    ajax: {
      url: "/users/list",
      data: {},
    },
    initComplete: (settings, json) => {
      $(".tableLoader").css("display", "none");
    },
    language: {
      paginate: {
        previous: '<i class="ion-arrow-left-a">',
        next: '<i class="ion-arrow-right-a">',
      },
    },
    drawCallback: () => {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
    },
  });
  $("#driver-datatable").DataTable({
    aoColumnDefs: [
      {
        defaultContent: "-",
        targets: "_all",
      },
    ],
    stateSave: true,
    searchDelay: 700,
    aaSorting: [[0, "desc"]],
    processing: true,
    serverSide: true,
    ajax: {
      url: "/driver/list",
      data: {},
    },
    initComplete: (settings, json) => {
      $(".tableLoader").css("display", "none");
    },
    language: {
      paginate: {
        previous: '<i class="ion-arrow-left-a">',
        next: '<i class="ion-arrow-right-a">',
      },
    },
    drawCallback: () => {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
    },
  });
  $("#welcome-datatable").DataTable({
    aoColumnDefs: [
      {
        defaultContent: "-",
        targets: "_all",
      },
    ],
    stateSave: true,
    searchDelay: 700,
    aaSorting: [[0, "desc"]],
    processing: true,
    serverSide: true,
    ajax: {
      url: "/welcome/list",
      data: {},
    },
    initComplete: (settings, json) => {
      $(".tableLoader").css("display", "none");
    },
    language: {
      paginate: {
        previous: '<i class="ion-arrow-left-a">',
        next: '<i class="ion-arrow-right-a">',
      },
    },
    drawCallback: () => {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
    },
  });
  $("#yards-datatable").DataTable({
    aoColumnDefs: [
      {
        defaultContent: "-",
        targets: "_all",
      },
    ],
    stateSave: true,
    searchDelay: 700,
    aaSorting: [[0, "desc"]],
    processing: true,
    serverSide: true,
    ajax: {
      url: "/yards/list",
      data: {},
    },
    initComplete: (settings, json) => {
      $(".tableLoader").css("display", "none");
    },
    language: {
      paginate: {
        previous: '<i class="ion-arrow-left-a">',
        next: '<i class="ion-arrow-right-a">',
      },
    },
    drawCallback: () => {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
    },
  });
  $("#vehicletype-datatable").DataTable({
    aoColumnDefs: [
      {
        defaultContent: "-",
        targets: "_all",
      },
    ],
    stateSave: true,
    searchDelay: 700,
    aaSorting: [[0, "desc"]],
    processing: true,
    serverSide: true,
    ajax: {
      url: "/vehicletype/list",
      data: {},
    },
    initComplete: (settings, json) => {
      $(".tableLoader").css("display", "none");
    },
    language: {
      paginate: {
        previous: '<i class="ion-arrow-left-a">',
        next: '<i class="ion-arrow-right-a">',
      },
    },
    drawCallback: () => {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
    },
  });
});