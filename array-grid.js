Ext.onReady(function(){

    // NOTE: This is an example showing simple state management. During development,
    // it is generally best to disable state management as dynamically-generated ids
    // can change across page loads, leading to unpredictable results.  The developer
    // should ensure that stable state ids are set for stateful components in real apps.    

    var cp = new Ext.state.CookieProvider({
       path: "/extjs_test/",
       expires: new Date(new Date().getTime()+(1000*60*60*24*30)), //30 days
       domain: "localhost"
    });


   Ext.state.Manager.setProvider(cp);

    var store = new Ext.data.JsonStore({
	// store configs
	autoDestroy: true,
	autoLoad: true,
	url: '/ext2ora/load.php',
	storeId: 'myStore',
	//load : function( st, records, options ) {alert(records);},
	// reader configs
	root: 'rows',
	idProperty: 'OWNER',
	fields: ['OWNER' ]
    });

    var table_store = new Ext.data.JsonStore({
	// store configs
	autoDestroy: true,
	//autoLoad: true,
	url: '/ext2ora/load.php',
	storeId: 'tableStore',
	//load : function( st, records, options ) {alert(records);},
	// reader configs
	root: 'rows',
	idProperty: 'TABLE_NAME',
	fields: ['TABLE_NAME' ]
    });

    var view_store = new Ext.data.JsonStore({
	autoDestroy: true,
	url: '/ext2ora/load.php',
	storeId: 'viewStore',
	root: 'rows',
	idProperty: 'VIEW_NAME',
	fields: ['STATUS','VIEW_NAME']
    });


    var grid_store = new Ext.data.JsonStore({
	// store configs
	autoDestroy: true,
	//autoLoad: true,
	url: '/ext2ora/load.php',
	storeId: 'myStore',
	messageProperty : 'message',
        listeners: {
            'exception': function(m) {
                //alert(m);
            }
        },
	root: 'rows'
    });

    var combo = new Ext.form.ComboBox({
        store: store,
	id : 'schema_combo',
        displayField:'OWNER',
	valueField: 'OWNER',
        typeAhead: true,
        mode: 'local',
        forceSelection: true,
        triggerAction: 'all',
        emptyText:'Select a schema...',
        selectOnFocus:true,
	width: 570,
	listeners:{
    	    scope: this,
    	    select: function(cb,value){
		var lw = Ext.getCmp('schema-grid');
                lw.setDisabled(true);
                lw.store.removeAll();
                lw.store.reload({
                    params: { schema: value.id }
                });
                lw.setDisabled(false);
	    }
	}
        //applyTo: 'combobox'
    });

    var schemaGrid = new Ext.grid.GridPanel({
        store: table_store,
        id : 'schema-grid',
        columns: [
            {id:'TABLE_NAME',header: 'Schema', dataIndex: 'TABLE_NAME'}
        ],
        stripeRows: true,
        //autoExpandColumn: 'OWNER',
        height: 500,
        //width: 600,
	autoExpandColumn:'TABLE_NAME',
	listeners:{
	    scope: this,
	    rowclick: function(g,rowIndex,e){
		var cb = Ext.getCmp('schema_combo');
		var grid = Ext.getCmp('browser-grid');
		var akt_schema = cb.getValue();
		selRec = g.getStore().getAt(rowIndex);
		
		grid.store.baseParams='';
		grid.store.setBaseParam('schema' , akt_schema);
		grid.store.setBaseParam('table' ,  selRec.id);
                grid.store.removeAll();
                grid.store.reload({
                    params: { schema : akt_schema , table :  selRec.id}
                });
            }
	},
        title: 'Tables'
        // config options for stateful behavior
        //stateful: true,
        //editable: true
        //stateId: 'grid'
    });


    var viewGrid = new Ext.grid.GridPanel({
        store: view_store,
        id : 'view-grid',
        columns: [
            {header: 'Status', dataIndex: 'STATUS'},
            {id:'VIEW_NAME',header: 'Name', dataIndex: 'VIEW_NAME'}
        ],
        stripeRows: true,
        //autoExpandColumn: 'OWNER',
        height: 500,
        //width: 600,
	autoExpandColumn:'VIEW_NAME',
	listeners:{
	    scope: this,
	    rowclick: function(g,rowIndex,e){
		var cb = Ext.getCmp('schema_combo');
		var grid = Ext.getCmp('browser-grid');
		var akt_schema = cb.getValue();
		selRec = g.getStore().getAt(rowIndex);
		
		grid.store.baseParams='';
		grid.store.setBaseParam('schema' , akt_schema);
		grid.store.setBaseParam('table' ,  selRec.id);
                grid.store.removeAll();
                grid.store.reload({
                    params: { schema : akt_schema , table :  selRec.id}
                });
            },
	    activate: function(){
		var cb = Ext.getCmp('schema_combo');
		var akt_schema = cb.getValue();
		fillViewGrid(akt_schema);
	    }

	},
        title: 'Views'
        // config options for stateful behavior
        //stateful: true,
        //editable: true
        //stateId: 'grid'
    });


    /**
     * Custom function used for column renderer
     * @param {Object} val
     */
    function change(val){
        if(val > 0){
            return '<span style="color:green;">' + val + '</span>';
        }else if(val < 0){
            return '<span style="color:red;">' + val + '</span>';
        }
        return val;
    }

    /**
     * Custom function used for column renderer
     * @param {Object} val
     */
    function pctChange(val){
        if(val > 0){
            return '<span style="color:green;">' + val + '%</span>';
        }else if(val < 0){
            return '<span style="color:red;">' + val + '%</span>';
        }
        return val;
    }

    var grid = new Ext.grid.GridPanel({
        store: grid_store,
	id : 'row-grid',
        columns: [
        /*    {id:'OWNER',header: 'SCHEMA', dataIndex: 'OWNER'}*/
        ],
        stripeRows: true,
        //autoExpandColumn: 'OWNER',
        height: 200,
        width: 600,
        bbar : new Ext.PagingToolbar({
            pageSize   : 30,
            store      : grid_store,
            displayInfo: true,
            displayMsg : 'Displaying rows {0} - {1} of {2}',
            emptyMsg   : 'No rows to display'
        }),
        title: 'Array Grid',
        // config options for stateful behavior
        stateful: true,
	editable: true
        //stateId: 'grid'        
    });

    grid_store.addListener("metachange", function(store, meta){
	var grid = Ext.getCmp('row-grid');

	var columns = [];
	if(meta.fields.length == 1){//ha csak egy mezo van (pl hibauzi), akkor az elfoglalhatja a teljes gridet
	    grid.view.forceFit = true;
	} else {
	    grid.view.forceFit = false;
	}
	for (var i = 0; i < meta.fields.length; i++ ) {
	    /*var plugin = new Ext.grid.CheckColumn({
		header: meta.fields[i].header,
		dataIndex: meta.fields[i].name,
		grid: grid,
		width: 120 //if we need plugin
	    });*/
	    columns.push( { header: meta.fields[i].header, dataIndex: meta.fields[i].name, type: meta.fields[i].type }); //for fields that don't require plugins
	    
	    //columns.push(plugin);
	    //plugin.init(grid);

	//use columns.push( { header: meta.fields[i].header, dataIndex: meta.fields[i].name, type: meta.fields[i].type }); for fields that don't require plugins
	}
	grid.reconfigure(grid_store, new Ext.grid.ColumnModel(columns));
    });
    

    var exec = new Ext.Button({
	id : 'exec_button',
        text: 'Execute',
	//applyTo : 'exec-button',
	listeners:{
	    scope: this,
	    click: function(){
		var ta = Ext.getCmp('sql_window');
		sendSql(ta.getValue());
	    }
	}
    });

    function sendSql(sql){
	var grid = Ext.getCmp('row-grid');

	grid.store.baseParams='';
	grid.store.setBaseParam('sql' , sql);
        grid.store.removeAll();
        grid.store.reload({
        params: { sql: sql}
	    });
    }

    function succSql(response,opt){
	alert(response.responseText);
	var obj = Ext.decode(response.responseText);
	//alert(obj.rows);
    }

    function failSql(response,opt){
	alert(response.responseText);
    }

    function getTACurPos(taId) {
	el = document.getElementById(taId);
	if (el.selectionStart) { 
	    return el.selectionStart; 
	} else if (document.selection) { 
	    el.focus(); 
	    var r = document.selection.createRange(); 
	    if (r == null) { 
		return 0; 
	    } 

	    var re = el.createTextRange(), 
    	    rc = re.duplicate(); 
	    re.moveToBookmark(r.getBookmark()); 
	    rc.setEndPoint('EndToStart', re); 

	    return rc.text.length; 
	}  
	return 0; 
    }

    function getCurLine(pos,text){
	var startPos = text.lastIndexOf("\n\n",pos-1);
	var endPos = text.indexOf("\n\n",pos);
	if(startPos == -1) startPos = 0;
	if(endPos == -1){
	     newString = text.slice(startPos);
	} else {
	     newString = text.slice(startPos,endPos);
	}
	//alert(startPos+":"+endPos+" "+newString);
	return newString;
    }

    function fillViewGrid(schema){
	var vg = Ext.getCmp('view-grid');
        vg.setDisabled(true);
        vg.store.removeAll();
        vg.store.reload({
            params: { schema: schema, view : 1 }
        });
        vg.setDisabled(false);
    }

    var sqlwindow = new Ext.form.TextArea({
	id : 'sql_window',
        height: 500,
        width: 600,
        title: 'Sql windows',
	//applyTo : 'sql-window'
	enableKeyEvents : true,
	listeners:{
	    scope: this,
	    keyPress: function(o,e){
		if(e.ctrlKey==true && e.keyCode==13){
		    //ronda, hogy lenyulok a DOM TA objectig, de maskepp nincs meg a kurzor posizioja
		    var curPos = getTACurPos(o.id);
		    var selSql = getCurLine(curPos,o.getRawValue());
		    sendSql(selSql);
		}
	    }
	}
    });


    var browser_store = new Ext.data.JsonStore({
	// store configs
	autoDestroy: true,
	//autoLoad: true,
	url: '/ext2ora/load.php',
	storeId: 'browserStore',
	messageProperty : 'message',
        listeners: {
            'exception': function(m) {
                //alert(m);
            }
        },
	root: 'rows'
    });

    var browserGrid = new Ext.grid.GridPanel({
        store: browser_store,
	id : 'browser-grid',
        columns: [
        ],
        stripeRows: true,
        height: 200,
        width: 600,
        bbar : new Ext.PagingToolbar({
            pageSize   : 30,
            store      : grid_store,
            displayInfo: true,
            displayMsg : 'Displaying rows {0} - {1} of {2}',
            emptyMsg   : 'No rows to display'
        }),
        title: 'Data Browser',
        stateful: true,
	editable: true
        //stateId: 'grid'        
    });

    browser_store.addListener("metachange", function(store, meta){
	var grid = Ext.getCmp('browser-grid');

	var columns = [];
	if(meta.fields.length == 1){//ha csak egy mezo van (pl hibauzi), akkor az elfoglalhatja a teljes gridet
	    grid.view.forceFit = true;
	} else {
	    grid.view.forceFit = false;
	}
	for (var i = 0; i < meta.fields.length; i++ ) {
	    /*var plugin = new Ext.grid.CheckColumn({
		header: meta.fields[i].header,
		dataIndex: meta.fields[i].name,
		grid: grid,
		width: 120 //if we need plugin
	    });*/
	    columns.push( { header: meta.fields[i].header, dataIndex: meta.fields[i].name, type: meta.fields[i].type }); //for fields that don't require plugins
	    
	    //columns.push(plugin);
	    //plugin.init(grid);

	//use columns.push( { header: meta.fields[i].header, dataIndex: meta.fields[i].name, type: meta.fields[i].type }); for fields that don't require plugins
	}
	grid.reconfigure(browser_store, new Ext.grid.ColumnModel(columns));
    });




    var schemaTabs = new Ext.TabPanel({
        width:450,
        activeTab: 0,
        frame:true,
        defaults:{autoHeight: false},
        items:[schemaGrid
            ,viewGrid
        ]
    });



    var sqlPanel = new Ext.Panel({
    height: 800,
    items: [
	{
	layout : 'vbox',
	items:[
        exec
	,sqlwindow
	,grid
	]}
	]
    });


    var browserPanel = new Ext.Panel({
    height: 800,
    layout: 'border',
    items: [
	{
    	    region: 'west',
    	    layout: 'vbox',
    	    width:300,
    	    minWidth: 100,
    	    maxWidth: 250,
    	    items:[
		combo
		,schemaTabs
    	    ]
	},{
	    region : 'center',
	    layout : 'vbox',
	    items:[browserGrid
	    ]
	}
	]
    });

    var mainTabs = new Ext.TabPanel({
        activeTab: 0,
        //frame:true,
	height: 800,
        defaults:{autoHeight: true},
        items:[sqlPanel
            ,browserPanel
        ]
    });

new Ext.Viewport({
    layout: 'auto',
    items: [mainTabs
    ]});


});
