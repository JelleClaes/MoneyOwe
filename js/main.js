var dbShell;

function dbErrorHandler(err){
    alert("DB Error: "+err.message + "\nCode="+err.code);
}

function phoneReady(){
    dbShell = window.openDatabase("Contacts", 1, "Contacts", 1000000);
    dbShell.transaction(setupTable,dbErrorHandler,getEntries);
}

function setupTable(tx){
    tx.executeSql("CREATE TABLE IF NOT EXISTS schulden(id INTEGER PRIMARY KEY,name,amount,status,updated)");
}   

function getEntries() {
    dbShell.transaction(function(tx) {
        tx.executeSql("select id, name, amount,status, updated from schulden order by updated name",[],renderEntries,dbErrorHandler);
    }, dbErrorHandler);
}
    
function renderEntries(tx,results){
    if (results.rows.length == 0) {
        $("#mainContent").html("<p>You currently do not have any notes.</p>");
    } else {
       var s = "";
       for(var i=0; i<results.rows.length; i++) {
         s += "<li><a href='edit.html?id="+results.rows.item(i).id + "'>" + results.rows.item(i).name + "</a></li>";   
       }
       $("#noteTitleList").html(s);
       $("#noteTitleList").listview("refresh");
    }
}

function saveNote(note, cb) {
    if(note.title == "") note.title = "[No Title]";
    dbShell.transaction(function(tx) {
        if(note.id == "") tx.executeSql("insert into schulden(name,amount,updated) values(?,?,?)",[note.title,note.body, new Date()]);
        else tx.executeSql("update schulden set name=?, amount=?,status=?, updated=? where id=?",[note.title,note.body,note.body, new Date(), note.id]);
    }, dbErrorHandler,cb);
}

function init(){
    document.addEventListener("deviceready", phoneReady, false);
    
    $("#editNoteForm").live("submit",function(e) {
        var data = {title:$("#noteTitle").val(), 
                    body:$("#noteBody").val(),
                    id:$("#noteId").val()
        };
        saveNote(data,function() {
            $.mobile.changePage("index.html",{reverse:true});
        });
        e.preventDefault();
    });

    $("#homePage").live("pageshow", function() {
        getEntries(); 
    });

    $("#editPage").live("pageshow", function() {
        var loc = var loc = $(this).data("url");
        if(loc.indexOf("?") >= 0) {
            var qs = loc.substr(loc.indexOf("?")+1,loc.length);
            var noteId = qs.split("=")[1];
            $("#editFormSubmitButton").attr("disabled","disabled"); 
            dbShell.transaction(
                function(tx) {
                    tx.executeSql("select id,title,body from schulden where id=?",[noteId],function(tx,results) {
                        $("#noteId").val(results.rows.item(0).id);
                        $("#noteTitle").val(results.rows.item(0).title);
                        $("#noteBody").val(results.rows.item(0).body);
                        $("#editFormSubmitButton").removeAttr("disabled");   
                    });
                }, dbErrorHandler);            
        } else {
         $("#editFormSubmitButton").removeAttr("disabled");   
        }
    });
}