import Vue from 'vue'
/* eslint-disable*/
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import moment from 'moment'
import * as services from './services'

Vue.use(Vuex)

function setProgressBar(state, todoObject) {
  var p_id = todoObject.parentId
  var totalSubtask = state.todolist.find(todo => todo.id === p_id).subtask_count ? state.todolist.find(todo => todo.id === p_id).subtask_count : 0
  var completedSubtask = state.todolist.find(todo => todo.id === p_id).completed_subtask_count ? state.todolist.find(todo => todo.id === p_id).completed_subtask_count : 0
  state.todolist.find(todo => todo.id === p_id).progress_count = completedSubtask + " / " + totalSubtask;
  if (totalSubtask > 0) {
    var percentage = (completedSubtask / totalSubtask) * 100
    state.todolist.find(todo => todo.id === p_id).progress = percentage
  }
  else {
    state.todolist.find(todo => todo.id === p_id).progress = 0
  }
}

function uploadFileOnAmazonS3(file, cb) {
  var bucket = new AWS.S3({ params: { Bucket: 'airflowbucket1/obexpense/expenses' } });
  if (file) {
    var params = { Key: file.name, ContentType: file.type, Body: file };
    bucket.upload(params).on('httpUploadProgress', function (evt) {
      console.log("Uploaded :: " + parseInt((evt.loaded * 100) / evt.total) + '%');
      store.state.progress = parseInt((evt.loaded * 100) / evt.total)
      store.commit('progressVal')
    }).send(function (err, data) {
      cb(data.Location)
    });
  }
  return false;
}

function setCheckboxColor(state) {
  var todoLength = state.todolist
  for (var i = 0; i < todoLength.length; i++) {
    if (state.isDueDate) {
      var d = new Date()
      d.setDate(d.getDate() + 2)
      if (todoLength[i].dueDate) {
        if (moment(todoLength[i].dueDate).isBetween(new Date(), d)) {
          $('#' + todoLength[i].id).removeClass('DueDate--future').removeClass('DueDate--overdue').addClass('DueDate--soon')
        } else if (moment(todoLength[i].dueDate).isBefore(new Date())) {
          $('#' + todoLength[i].id).removeClass('DueDate--future').removeClass('DueDate--soon').addClass('DueDate--overdue')
        } else if (moment(todoLength[i].dueDate).isAfter(new Date())) {
          $('#' + todoLength[i].id).removeClass('DueDate--overdue').removeClass('DueDate--soon').addClass('DueDate--future')
        }
      } else {
        $('#' + todoLength[i].id).removeClass('DueDate--soon')
        $('#' + todoLength[i].id).removeClass('DueDate--overdue')
        $('#' + todoLength[i].id).removeClass('DueDate--future')
      }
    } else {
      $('#' + todoLength[i].id).removeClass('DueDate--soon')
      $('#' + todoLength[i].id).removeClass('DueDate--overdue')
      $('#' + todoLength[i].id).removeClass('DueDate--future')
    }
  }
}

function updateObject(oldObject, newObject) {
    var keys= Object.keys(oldObject)
    console.log("Keys-->",keys);
       for (var i = 0; i < keys.length; i++) {

            oldObject[keys[i]] = newObject[keys[i]];
       }
   }

export const store = new Vuex.Store({
  state: {
    userObject: {},
    isAuthorized: false,
    todolist: [],
    parentIdArr: [],
    progress_count: '',
    visibility: 'active',
    arrAttachment: [],
    isLoading: false,
    settingsObject: [],
    taskComment: [],
    taskTags: [],
    tagsList:[],
    isProgress: false,
    isDueDate: false
  },
  mutations: {
    userData: state => state.userObject,
    authorize: state => state.isAuthorized,
    progressVal: state => state.progress,
    // showProgress: state => state.isProgress,
    // showLoader: state => state.isLoading,
    showAttachmentProgress(state, data)
    {
      let index = _.findIndex(state.todolist, function (d) { return d.id == data.id })
      state.todolist[index].attachmentprogress = data.isProgress
    },
    deleteAttachmentProgress(state, data)
    {
      let index = _.findIndex(state.todolist, function (d) { return d.id == data.id })
      state.todolist[index].deleteprogress = data.isProgress
    },
    GET_TODO(state, data) {
      // state.todolist = data
      if (state.todolist.length > 0) {

        for (var i = 0; i < data.length; i++) {
          // console.log('Inside forloop', data)
          let index = _.findIndex(state.todolist, function (d) { return d.id == data[i].id })
          // console.log('index', index)
          if (index > -1) {
            state.todolist.splice(index, 1, data[i]);
          } else {
            state.todolist.push(data[i])
          }
        }
      }
      else {
        state.todolist = data
      }
      // console.log('todolist', state.todolist)
    },
    // ADD_NEW_TODOS(state,todo)     
    // {       
    //   console.log('Add TODO', state.todolist)
    //   state.todolist.push(todo)    
    // },
    async SHOW_DIV(state, payload) {
      // console.log('payload.level', payload)

      var parentTaskId = payload.id ? payload.id : '';
      if (parentTaskId != -1) {
        // window.history.pushState("", "Title", "http://localhost:3000/navbar/task/" + (payload.level + 1) + "/" + payload.id);
        await store.dispatch('getAllTodos', { 'parentId': payload.id });
        await store.dispatch('getAttachmentFromDB', payload.id)
        await store.dispatch('getAllTaskTags',payload.id);
        
        var parentIdArrObj = payload
        var tempParentIds = _.chain([]).union(state.parentIdArr).sortBy([function (o) { return o.level; }]).value();
        if (state.parentIdArr.length > 0) {
          state.parentIdArr.splice(0, state.parentIdArr.length);
          for (var i = 0; i < tempParentIds.length; i++) {
            if (tempParentIds[i].level < parentIdArrObj.level) {
              state.parentIdArr.push(tempParentIds[i]);
            }
          }
          state.parentIdArr.push(parentIdArrObj);
        }
        else {
          state.parentIdArr.push(parentIdArrObj);
        }
        // console.log('parentIdArr', state.parentIdArr)
      }
    },
    REMOVE_PARENT_ID_ARRAY(state) {
      state.parentIdArr.splice(0, state.parentIdArr.length)
      state.todolist.splice(0, state.todolist.length)
      state.arrAttachment.splice(0,state.arrAttachment.length)
      state.settingsObject.splice(0, state.settingsObject.length)
    },
    changeFilters(state, key) {
      state.visibility = key
    },
    UPDATE_TODO(state, item) {
      console.log('Update TODO') 
       let updateTodoIndex = _.findIndex(state.todolist,function(d){return d.id == item.id})
        //  console.log('item Before:', updateTodoIndex) 
       updateObject(state.todolist[updateTodoIndex],item)
      // state.todolist.filter(todo => todo.id === item.id) == item
      // console.log('Todolist Obj After:', state.todolist)
      //console.log('new obj', obj)

       if (item.parentId) {
        var p_id = item.parentId
        var completedSubtaskCount = state.todolist.find(todo => todo.id === p_id).completed_subtask_count
        var subtask_count = state.todolist.find(todo => todo.id === p_id).subtask_count
        if (item.completed) {
          state.todolist.find(todo => todo.id === p_id).completed_subtask_count = completedSubtaskCount + 1
        }
        else {
          state.todolist.find(todo => todo.id === p_id).completed_subtask_count = completedSubtaskCount - 1
        }
        setProgressBar(state, item)
       }

       setCheckboxColor(state)
    },
    ADD_NEW_TODOS(state, todoObject) {
      todoObject.subtask_count = 0
      todoObject.completed_subtask_count = 0
      todoObject.progress_count = ''
      state.todolist.push(todoObject)  

      // let todoElement = todoObject.todo
      // let temp_id = todoObject.data.generated_keys[0]
      // state.todolist.push({
      //   id: temp_id,
      //   parentId: todoElement.parentId,
      //   taskName: todoElement.taskName,
      //   taskDesc: '',
      //   level: todoElement.level,
      //   completed: false,
      //   index: todoElement.index,
      //   dueDate: '',
      //   createdAt: new Date().toJSON(),
      //   updatedAt: new Date().toJSON(),
      //   subtask_count: 0,
      //   completed_subtask_count: 0,
      //   progress_count: ''
      // })
      // console.log("add todo")
      if (todoObject.parentId) {
        // console.log("add todo element",state.todolist.find(todo => todo.id === todoElement.parentId) )
        let tempObj = state.todolist.find(todo => todo.id === todoObject.parentId).subtask_count
        state.todolist.find(todo => todo.id === todoObject.parentId).subtask_count = tempObj + 1
        setProgressBar(state, todoObject)
      }
    },
    deleteTodo(state, todoObject) {
       let removeTodoIndex = _.findIndex(state.todolist,function(d){return d.id == todoObject.id})
        state.todolist.splice(removeTodoIndex, 1)
        if(todoObject.parentId)
        {
          let tempObj = state.todolist.find(todo => todo.id === todoObject.parentId).subtask_count
          state.todolist.find(todo => todo.id === todoObject.parentId).subtask_count = tempObj - 1
          if(todoObject.completed === true){
            let completedObj = state.todolist.find(todo => todo.id === todoObject.parentId).completed_subtask_count
            state.todolist.find(todo => todo.id === todoObject.parentId).completed_subtask_count = completedObj - 1
          }
          setProgressBar(state, todoObject)
        }
    },
    // toggleTodo(state, todoObject) {
    //   if (todoObject.todo.parentId) {
    //     var p_id = todoObject.todo.parentId
    //     var completedSubtaskCount = state.todolist.find(todo => todo.id === p_id).completed_subtask_count
    //     var subtask_count = state.todolist.find(todo => todo.id === p_id).subtask_count
    //     if (todoObject.isCheck) {
    //       state.todolist.find(todo => todo.id === p_id).completed_subtask_count = completedSubtaskCount + 1
    //     }
    //     else {
    //       state.todolist.find(todo => todo.id === p_id).completed_subtask_count = completedSubtaskCount - 1
    //     }
    //     setProgressBar(state, todoObject)
    //     // var totalSubtask= subtask_count ? subtask_count : 0
    //     // var completedSubtask = state.todolist.find(todo => todo.id === p_id).completed_subtask_count ? state.todolist.find(todo => todo.id === p_id).completed_subtask_count : 0
    //     // state.progress_count = completedSubtask + " / " + totalSubtask;
    //     // if (totalSubtask > 0) {
    //     //     var percentage = (completedSubtask / totalSubtask) * 100
    //     //     state.todolist.find(todo => todo.id === p_id).progress = percentage
    //     // }
    //   }
    // },
    SELECT_FILE(state, fileObject) {
      if (fileObject instanceof Array) {
        _.forEach(fileObject, function (object) {
          let index = _.findIndex(state.arrAttachment, function (d) { return d.id == object.id })
          // console.log('index: ', index)
          if (index < 0) {
            state.arrAttachment.push(object)
          }
        });
      }
       else if(fileObject instanceof Object)
    {
      console.log("File:-->",fileObject);
      console.log("state.arrAttachment before:-->",state.arrAttachment.length)
      // if(fileObject.id){
      //   // Replacing array to display name when uploading started
      //    console.log("<--Replace--->");
      //   var start_index = state.arrAttachment.length - 1
      //   var number_of_elements_to_remove = 1
      //   state.arrAttachment.splice(start_index, number_of_elements_to_remove, fileObject)
      // }else{
      //   console.log("<--Firstime--->");
      //   state.arrAttachment.push(fileObject)
      // }
       state.arrAttachment.push(fileObject)
      console.log("state.arrAttachment after:-->",state.arrAttachment)
    }
    },
    DELETE_ATTACHMENT(state, deleteAttachment) {
      let removeAttachementIndex = _.findIndex(state.arrAttachment,function(d){return d.id == deleteAttachment.id})
      console.log("removeAttachementIndex Index-->",removeAttachementIndex)
      state.arrAttachment.splice(removeAttachementIndex, 1)
    },
    DELETE_ATTACHMENTS(state) {
      state.arrAttachment = []
    },
    GET_SETTINGS(state, data) {
      state.settingsObject = data
    },
    GET_TASK_COMMENT(state, data) {
      state.taskComment = data
    },
    ADD_COMMENT(state, data){
      let temp_id = data.response.generated_keys[0]
      state.taskComment.push({
                id:temp_id,
                task_id: data.payload.id,
                commentBy: data.payload.commentBy,
                comment: data.payload.comment,
                createdAt: new Date().toJSON()
      })
    },
    updateTodo(state, todoObject) {
      // setCheckboxColor(state, todoObject)
    },
    SETTING_UPDATE(state, todoObject) {
      console.log("todoObject",todoObject)
      var flag = 0
      if(todoObject.event=== true){
        flag = 1
      }else{
        flag =0
      }
      if (todoObject.arr.type === "progress" && !todoObject.arr.user_setting) {
        state.isProgress = true
      } else if (todoObject.arr.type === "progress") {
        state.isProgress = false
      }

      if (todoObject.arr.type === "duedate" && !todoObject.arr.user_setting) {
        state.isDueDate = true
      } else if (todoObject.arr.type === "duedate") {
        state.isDueDate = false
      }

      state.settingsObject.find(setting=> setting.id === todoObject.arr.id).user_setting = flag
      setCheckboxColor(state)
    },
      INSERT_TAG(state, tagObject) {
      // console.log('Insert tags-----------: ', tagObject);
      state.tagsList.push(tagObject); // this line added by hemant
      state.taskTags.push(tagObject)
      // console.log('arrTags: ', state.taskTags);
    },
    DELETE_ALLTAGS(state) {
      state.taskTags = []
    },
    GET_TASK_TAGS(state, datas){
      // console.log('before state.taskTags:',state.taskTags.length);
      console.log('TASK_TAGS before', datas)
      state.taskTags.push(datas)
            if(datas instanceof Array) {
          _.forEach(datas, function(data) {
                let index = _.findIndex(state.taskTags,function(d){return d.id == data.id})
                console.log('index: ', index)
                if (index < 0){
                  state.taskTags.push(data)
                } 
            });
      }else if(datas instanceof Object) {
        state.taskTags.push(data)
      }
      console.log('TASK_TAGS', state.taskTags)
    },
    GET_TAGS_LIST(state, data){
      state.tagsList = data
    },
    INSERT_TASKTAGS(state, taskTagObject) {
      state.taskTags.push({ "id": taskTagObject.tag.id, "name": taskTagObject.tag.name,"task_id": taskTagObject.task_id })
    },
    REMOVE_TASKTAG(state, taskTagObject) {
      console.log('taskTagObject:',taskTagObject);
      state.taskTags.splice(state.taskTags.indexOf(taskTagObject), 1)
    }

},
  actions: {
    eventListener({ commit }) {
        console.log("<-----addMessage:-->")
      // A new message has been created on the server, so dispatch a mutation to update our state/view
      services.tasksService.on('created', message => {
        console.log("Message Cretaed:-->",message)
        commit('ADD_NEW_TODOS', message)
      })

      
       services.tasksService.on('removed', message => {
        console.log("Message Removed:-->",message)
        commit('deleteTodo', message)
      })

       services.tasksService.on('patched', message => {
        console.log("Message Update:-->",message)
        commit('UPDATE_TODO', message)
      })


         services.taskAttachmentService.on('created', message => {
        console.log("Message Attachement Cretaed:-->",message)
        commit('SELECT_FILE', message)
      })

       services.taskAttachmentService.on('patched', message => {
        console.log("Message Attachement patched:-->",message)
        commit('DELETE_ATTACHMENT', message)
      })
    },
    getAllTodos({ commit }, payload) {
      console.log('parentId', payload.parentId);
      services.tasksService.find({query:{parentId:payload.parentId}}).then(response => {
             commit('GET_TODO', response.data)
          });
      // Vue.http.post('/tasks_parentId', { parentId: payload.parentId }).then(function (response) {
      //   commit('GET_TODO', response.data)
      // });
    },
    removeParentIdArray({ commit }) {
      commit('REMOVE_PARENT_ID_ARRAY')
    },
    insertTodo({ commit }, insertElement) {
      let dbId = insertElement.id
      if (!(insertElement.taskName && insertElement.taskName.trim()))
        return
      if (dbId != -1) {
        services.tasksService.patch(dbId,{taskName: insertElement.taskName,taskDesc: ''},{query:{'id': dbId}}).then(response => {
              console.log("Reesponse patch::",response.data);
             commit('UPDATE_TODO', insertElement)
          });
        // Vue.http.post('/updatetasks', {
        //   id: dbId,
        //   taskName: insertElement.taskName,
        //   taskDesc: '',
        // }).then(response => {
        //   commit('UPDATE_TODO', insertElement)
        //   // console.log('task update', response.data)
        // })
      } else {
        services.tasksService.create( {
                parentId: insertElement.parentId,
                taskName: insertElement.taskName,
                taskDesc: '',
                level: insertElement.level,
                completed: false, 
                index: insertElement.index,
                dueDate:'',
                createdAt: new Date().toJSON(),
                updatedAt: new Date().toJSON()
            }).then(response => {
              console.log("Reesponse create::",response);
            //  commit('addTodo', {"data":response, "todo": insertElement})
          });
        // Vue.http.post('/tasks', {
        //   parentId: insertElement.parentId,
        //   taskName: insertElement.taskName,
        //   taskDesc: '',
        //   level: insertElement.level,
        //   completed: false,
        //   index: insertElement.index,
        //   dueDate: '',
        //   createdAt: new Date().toJSON(),
        //   updatedAt: new Date().toJSON()
        // })
        //   .then(function (response) {
        //     commit('addTodo', { "data": response.data, "todo": insertElement })
        //     // console.log("Response:", response)
        //   })
      }
    },
    editTaskName({ commit }, editObject) {
      if (editObject.todo.id) {
        services.tasksService.patch(editObject.todo.id, {
                    id: editObject.todo.id,
                    taskName: editObject.todo.taskName,
                    taskDesc: editObject.todo.taskDesc,
                    dueDate: editObject.selectedDate,
                    estimatedTime: editObject.estimatedTime,
                    priority: editObject.taskPriority
                },{query:{'id': editObject.todo.id}}).then(response => {
              console.log("Reesponse editTaskName::",response);
            //  commit('UPDATE_TODO', insertElement)
          });
        // Vue.http.post('/updatetasks', {
        //   id: editObject.todo.id,
        //   taskName: editObject.todo.taskName,
        //   taskDesc: editObject.todo.taskDesc,
        //   dueDate: editObject.selectedDate ? editObject.selectedDate.toJSON() : '',
        //   estimatedTime: editObject.estimatedTime,
        //   priority: editObject.taskPriority
        // }).then(response => {
        //   // console.log('task updated', response.data)
        //   commit('updateTodo', editObject)
        // })
      }
    },
    deleteTodo({ commit }, deleteElement) {
      console.log(deleteElement)
      let dbId = deleteElement.id
      if (dbId) {
        services.tasksService.remove(dbId, {query:{'id': dbId}}).then(response => {
              console.log("Reesponse deleteTodo::",response);
              //  commit('deleteTodo', {"data":response, "todo": deleteElement})
          });
        // Vue.http.delete('/deteletask/' + dbId, {
        // }).then(response => {
        //   commit('deleteTodo', { "data": response.data, "todo": deleteElement })
        //   console.log('task deleted', response.data)
          // if(this.filteredTodos.length-1 > 0)
          // {
          //   console.log('ID-Level:', this.filteredTodos[0].parentId, "===", this.filteredTodos[0].level);
          //   var todoList = store.state.todo1(this.filteredTodos[0].parentId, (this.filteredTodos[0].level-1)); 
          //   console.log('todoList:', todoList);
          //   for(var i=0; i < todoList.length-1 ; i++)
          //   {
          //     if(todoList[i].id)
          //       {
          //         this.$http.post('/updatetasks', {
          //         id: todoList[i].id,
          //         index: i
          //         }).then(response => {
          //           console.log('index updated after remove task', response.data)
          //       })
          //       }
          //   }
          // }
        // })
      }
    },
    dragTodo({commit}, dragTodo){
      for(var i=0; i < dragTodo.length-1 ; i++)
      {
        if(dragTodo[i].id)
        {
          services.tasksService.patch(dragTodo[i].id, {
                  id: dragTodo[i].id,
                  index: i
              },{query:{'id': dragTodo[i].id}}).then(response => {
              //console.log("Reesponse dragtodo::",response);
          });
          
        }
      }
    },
    toggleTodo({ commit }, changeTodo) {
      // console.log(changeTodo)
      let dbId = changeTodo.todo.id
      if (dbId) {
        services.tasksService.patch(dbId, {
                  id: dbId,
                  completed: changeTodo.todo.completed
              },{query:{'id': dbId}}).then(response => {
              console.log("Reesponse toggleTodo::",response);
            //  commit('UPDATE_TODO', insertElement)
          });
        // Vue.http.post('/updatetasks', {
        //   id: dbId,
        //   completed: changeTodo.todo.completed
        // }).then(response => {
        //   commit('toggleTodo', changeTodo)
        //   // console.log('task updated', response.data)
        // })
      }
    },
    selectFile({ commit }, fileObject) {
      var file = fileObject.file.files[0];

       var attachArr = {
         id:new Date().valueOf(),
        file_name: file.name,
        task_id: fileObject.taskId,
        level:fileObject.level
      }

      store.state.arrAttachment.push(attachArr);
      // commit('SELECT_FILE', attachArr)

      //store.state.isProgress = true
      console.log('Task ID', fileObject.taskId)
      store.commit('showAttachmentProgress', {'isProgress': true, 'id': fileObject.taskId})
      uploadFileOnAmazonS3(file, function(src){
        // store.state.isProgress = false
      store.commit('showAttachmentProgress', {'isProgress': false, 'id': fileObject.taskId})
        // store.commit('showProgress')
        store.state.progress = 0
        store.commit('progressVal')

          //Insert Attachment detail in DB
        services.taskAttachmentService.create({
          task_id: fileObject.taskId,
          file_name: file.name,
          file_url: src,
          uploadedBy: store.state.userObject.id,
          level: fileObject.level,
          isDeleted: false
        }).then(response => {
          console.log("Reesponse Attachment create::", response);
          console.log("Attachment Remove Before---->::", store.state.arrAttachment.length);
           store.state.arrAttachment.splice(store.state.arrAttachment.indexOf(attachArr), 1)
           console.log("Attachment Remove After---->::", store.state.arrAttachment.length);
          var tempArr = {
            id: response.id,
            task_id: fileObject.taskId,
            file_name: file.name,
            file_url: src,
            uploadedBy: store.state.userObject.id,
            level: fileObject.level,
            isDeleted: false
          }
          // state.arrAttachment.filter(attachement => attachement.id === attachArr.id)
         
          // commit('SELECT_FILE', tempArr)
          fileObject.cb()
        });

      //   Vue.http.post('/addAttachment', {
      //     task_id: fileObject.taskId,
      //     file_name: file.name,
      //     file_url: src,
      //     uploadedBy: store.state.userObject.id,
      //     level: fileObject.level,
      //     isDeleted: false
      //   }).then(response => {
      //     var tempArr = {
      //       id: response.data.generated_keys[0],
      //       task_id: fileObject.taskId,
      //       file_name: file.name,
      //       file_url: src,
      //       uploadedBy: store.state.userObject.id,
      //       level: fileObject.level,
      //       isDeleted: false
      //     }
      //     commit('SELECT_FILE', tempArr)
      //     fileObject.cb()
      //   })
      })
    },
    deleteAttachmentFromDB({ commit }, deleteObject) {

      //store.state.isLoading = true
      console.log('deleted Task ID', deleteObject)
      store.commit('deleteAttachmentProgress', {'id': deleteObject.task_id, 'isProgress': true })
      //Delete image from amazon
      var bucketInstance = new AWS.S3();
      var params = {
        Bucket: 'airflowbucket1/obexpense/expenses',
        Key: deleteObject.file_name
      }
      bucketInstance.deleteObject(params, function (err, data) {
        if (data) {
          //Update attachment fields in DB
          services.taskAttachmentService.patch(deleteObject.id, {
              isDeleted: true,
              file_url: '',
              deletedBy: store.state.userObject.id
            }, { query: { 'id': deleteObject.id } }).then(response => {
              console.log("Reesponse deleteAttachment::", response);
              // commit('DELETE_ATTACHMENT', deleteObject.objAttachment)
              // store.state.isLoading = false
              store.commit('deleteAttachmentProgress', {'id': deleteObject.task_id, 'isProgress': false })
            });
          // Vue.http.post('/deleteAttachment', {
          //   id: deleteObject.objAttachment.id,
          //   isDeleted: true,
          //   file_url: '',
          //   deletedBy: store.state.userObject.id
          // }).then(response => {
          //   commit('DELETE_ATTACHMENT', deleteObject.objAttachment)
          //   store.state.isLoading = false
          //   store.commit('showLoader')
          // })
        }
        else {
          console.log("Check if you have sufficient permissions : ", err.stack);
        }
      });
    },
    removeAccessPermision({commit},data)
    {
    services.roleAccessService.remove(data.id,{query:{
        pId: data.pId,
        rId: data.rId
      }}).then(response => {
              console.log("Reesponse remove permission::",response);
              // if(response.data.length > 0){
          // commit('SELECT_FILE', response.data) 
        // }
          });
    },
    addAccessPermision({commit},data)
    {
    services.roleAccessService.create({
        pId: data.pId,
        rId: data.rId
      }).then(response => {
              console.log("Reesponse remove permission::",response);
              // if(response.data.length > 0){
          // commit('SELECT_FILE', response.data) 
        // }
          });
    },
    getAttachmentFromDB({ commit }, taskId) {
      console.log('get attachment called: ', taskId)
      services.taskAttachmentService.find({query:{
        task_id: taskId,
        isDeleted: false
      }}).then(response => {
              console.log("Reesponse getAttachmentFromDB::",response.data);
              if(response.data.length > 0){
          commit('SELECT_FILE', response.data) 
        }
          });
      // Vue.http.post('/getAttachments', {
      //   task_id: taskId,
      //   isDeleted: false
      // }).then(response => {
      //   if (response.data.length > 0) {
      //     commit('SELECT_FILE', response.data)
      //   }
      // })
    },
    getSettings({ commit }, payload) {
      Vue.http.post('/getSttings', {
        user_id: payload
      }).then(response => {
        commit('GET_SETTINGS', response.data)
        console.log("Get Settings", response.data)
      })
    },
     toggleSetting({ commit }, setting) {
      console.log("setting", setting)
      Vue.http.post('/updateUserSetting', {
        settings_id: setting.arr.id,
        setting_value: setting.event,
        user_id: setting.uId
      }).then(response => {
        console.log('setting update', response.data)
        // Vue.http.post('/getSttings', {
        //   user_id: setting.uId
        // }).then(response => {
        //   console.log("GetSettings", response.data)
        //   commit('GET_SETTINGS', response.data)
        // })
        commit('SETTING_UPDATE', setting)
      })
    },
    getTaskComment({ commit }) {
      Vue.http.get('/getComment').then(function (response) {
        commit('GET_TASK_COMMENT', response.data)
      });
    },
    insertTaskComment({ commit }, payload) {
      console.log(payload)
      Vue.http.post('/insertComment', {
        'task_id': payload.id,
        'commentBy': payload.commentBy,
        'comment': payload.comment,
        'createdAt': new Date().toJSON()
      })
        .then(function (response) {
          commit('ADD_COMMENT',{"payload": payload, "response":response.data})
          console.log("Response:", response)
        })
    },
    getAllTaskTags({commit}, taskId) {
      Vue.http.post('/getTaskTags', {
          task_id:taskId
      }).then(function(response) {
          commit('GET_TASK_TAGS', response.data)
        })
    },
    getTagsList({commit}){
      Vue.http.get('/getTags').then(function(response) {
            commit('GET_TAGS_LIST', response.data)
        });
    },
    insertTagsInDB({ commit }, tagObject) {
      console.log('tagObj: ', tagObject)
      Vue.http.post('/insert_tag', {
          name: tagObject.tagName,
          task_id: tagObject.taskId,
          created_by_user_id: store.state.userObject.id
      }).then(response => {
          console.log("response:", response);
          var id;
          if (response.ok) {
              id = response.body.tag_id;
              console.log("response", id);
              var tagArr = {
                "id": id,
                "name": tagObject.tagName,
                "task_id": tagObject.taskId
              }
              // Add tag into tags array
              commit('INSERT_TAG', tagArr)
          }
      })
    },
    insertIntoTaskTags({ commit }, taskTagObject) {
      console.log("taskTagObject", taskTagObject)
      Vue.http.post('/insert_taskTag', {
          tag_id: taskTagObject.tag.id,
          task_id: taskTagObject.taskId,
          created_by_user_id: store.state.userObject.id
      }).then(response => {
          console.log("response:", response);
          var id;
          if (response.ok) {
              // Add tag into tags array
              commit('INSERT_TASKTAGS', taskTagObject)
          }
      })
    },
    removeTaskTagsFromDB({ commit }, taskTagObject) {
      Vue.http.post('/deleteTaskTags', {
          task_id: taskTagObject.task_id,
          tag_id: taskTagObject.id
      }).then(response => {
          if (response.ok) {
              console.log("deleteTaskTags api response:", response.bodyText);
              commit('REMOVE_TASKTAG', taskTagObject)
          }
      })
    }
  },
  getters: {
    getTodoById: (state, getters) => {
      return function (id, level) {
        var todolist = state.todolist.filter(todo => todo.parentId === id, todo => todo.level === level)
        todolist = _.sortBy(todolist, 'index')
        //return _todolist.sortBy([function (o) { return o.index; }]).value();
        console.log('getter', todolist)
        return todolist
      }
    },
    parentIdArr: state => state.parentIdArr,
    // getAttachment: state => state.arrAttachment,
    getAttachment: (state, getters) => {
      return function (id, level) {
        var attachment = state.arrAttachment.filter(attachment => attachment.task_id === id)
        return attachment
      }
    },
    settingArr: state => state.settingsObject,
    getCommentById: (state, getters) => {
      return function (id) {
        return state.taskComment.filter(comment => comment.task_id === id)
      }
    },
    // getTaskTags: state => state.taskTags,
    getTaskTagsById: (state, getters) => {
      return function(id){
        console.log(state.taskTags.filter(tags => tags.task_id === id))
        return state.taskTags.filter(tags => tags.task_id === id)
      }
    },
  },
  plugins: [createPersistedState()]
})

