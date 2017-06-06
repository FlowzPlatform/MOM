import Vue from 'vue'
/* eslint-disable*/
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

function setProgressBar(state, todoObject){
    var p_id = todoObject.todo.parentId
    var totalSubtask= state.todolist.find(todo => todo.id === p_id).subtask_count ? state.todolist.find(todo => todo.id === p_id).subtask_count : 0
    var completedSubtask = state.todolist.find(todo => todo.id === p_id).completed_subtask_count ? state.todolist.find(todo => todo.id === p_id).completed_subtask_count : 0
    state.todolist.find(todo => todo.id === p_id).progress_count = completedSubtask + " / " + totalSubtask;
    if (totalSubtask > 0) {
        var percentage = (completedSubtask / totalSubtask) * 100
        state.todolist.find(todo => todo.id === p_id).progress = percentage
    }
    else{
      state.todolist.find(todo => todo.id === p_id).progress = 0
    }
}

export const store = new Vuex.Store({
  state: {
    userObject: {},
    isAuthorized: false,
    todolist: [],
    parentIdArr: [],
    progress_count: '',
    visibility:'active'
  },
  mutations: {
    userData: state => state.userObject,
    authorize: state => state.isAuthorized,
    GET_TODO (state, data) {
      // state.todolist = data
      if(state.todolist.length > 0)
      {
        for(var i = 0; i<data.length; i++)
        {
          // console.log('Inside forloop', data)
          let index = _.findIndex(state.todolist,function(d){return d.id == data[i].id})
          // console.log('index', index)
          if(index > -1){
             state.todolist.splice(index, 1, data[i]);
          }else{
            state.todolist.push(data[i])
          }
        }
      }
      else
      {
        state.todolist = data
      }
      // console.log('todolist', state.todolist)
    },
    async SHOW_DIV(state, payload){
      var parentTaskId = payload.id ? payload.id : '';
      if(parentTaskId)
      { 
        await store.dispatch('getAllTodos', {'parentId':payload.id});
        var parentIdArrObj = payload
        var tempParentIds =_.chain([]).union(state.parentIdArr).sortBy([function(o) { return o.level; }]).value();
        if(state.parentIdArr.length > 0)
        {
          state.parentIdArr.splice(0,state.parentIdArr.length);
          for (var i = 0; i < tempParentIds.length; i++) {
            if(tempParentIds[i].level < parentIdArrObj.level)
              {
                state.parentIdArr.push(tempParentIds[i]);
              } 
          }
          state.parentIdArr.push(parentIdArrObj);  
        }
        else
        {
           state.parentIdArr.push(parentIdArrObj);   
        }
        // console.log('parentIdArr', state.parentIdArr)
      }
    },
    REMOVE_PARENT_ID_ARRAY(state){
      state.parentIdArr.splice(0,state.parentIdArr.length)
      state.todolist.splice(0,state.todolist.length)
    },
    changeFilters(state, key){
      state.visibility = key
    },
    UPDATE_TODO(state, item){
      console.log('Todolist Obj Before:', state.todolist) 
      state.todolist.filter(todo => todo.id === item.id) == item
      console.log('Todolist Obj After:', state.todolist)
      //console.log('new obj', obj)
    },
    addTodo (state, todoObject) {
      let todoElement = todoObject.todo
      let temp_id = todoObject.data.generated_keys[0]
          //   state.todolist.push({
          //     id: temp_id,
          //     parentId: todoElement.parentId,
          //     taskName: todoElement.taskName,
          //     taskDesc: '',
          //     level: todoElement.level,
          //     completed: false, 
          //     index: todoElement.index,
          //     dueDate:'',
          //     createdAt: new Date().toJSON(),
          //     updatedAt: new Date().toJSON(),
          //     subtask_count:0,
          //     completed_subtask_count:0,
          //     progress_count:''
          // })
      console.log("add todo")
      if(todoElement.parentId){
        console.log("add todo element",state.todolist.find(todo => todo.id === todoElement.parentId) )
        let tempObj = state.todolist.find(todo => todo.id === todoElement.parentId).subtask_count
        state.todolist.find(todo => todo.id === todoElement.parentId).subtask_count = tempObj + 1
        setProgressBar(state, todoObject)
      }
    },
    deleteTodo(state, todoObject){
        state.todolist.splice(state.todolist.indexOf(todoObject.todo), 1)
        if(todoObject.todo.parentId)
        {
          let tempObj = state.todolist.find(todo => todo.id === todoObject.todo.parentId).subtask_count
          state.todolist.find(todo => todo.id === todoObject.todo.parentId).subtask_count = tempObj - 1
          if(todoObject.todo.completed === true){
            let completedObj = state.todolist.find(todo => todo.id === todoObject.todo.parentId).completed_subtask_count
            state.todolist.find(todo => todo.id === todoObject.todo.parentId).completed_subtask_count = completedObj - 1
          }
          setProgressBar(state, todoObject)
        }
    },
    toggleTodo(state, todoObject){
      if(todoObject.todo.parentId){ 
          var p_id = todoObject.todo.parentId
          var completedSubtaskCount = state.todolist.find(todo => todo.id === p_id).completed_subtask_count
          var subtask_count = state.todolist.find(todo => todo.id === p_id).subtask_count
          if(todoObject.isCheck){
            state.todolist.find(todo => todo.id === p_id).completed_subtask_count = completedSubtaskCount + 1
          }
          else{ 
              state.todolist.find(todo => todo.id === p_id).completed_subtask_count = completedSubtaskCount - 1
          }
          setProgressBar(state, todoObject)
          // var totalSubtask= subtask_count ? subtask_count : 0
          // var completedSubtask = state.todolist.find(todo => todo.id === p_id).completed_subtask_count ? state.todolist.find(todo => todo.id === p_id).completed_subtask_count : 0
          // state.progress_count = completedSubtask + " / " + totalSubtask;
          // if (totalSubtask > 0) {
          //     var percentage = (completedSubtask / totalSubtask) * 100
          //     state.todolist.find(todo => todo.id === p_id).progress = percentage
          // }
      }
    }
  },
  actions: {
     getAllTodos({commit}, payload) {
        // console.log('parentId', payload.parentId);
        Vue.http.post('/tasks_parentId',{parentId:payload.parentId}).then(function(response) {
            commit('GET_TODO', response.data)
        });
    },
    removeParentIdArray({commit}) {
      commit('REMOVE_PARENT_ID_ARRAY')
    },
    insertTodo({ commit }, insertElement) {
      let dbId = insertElement.id
      if(!(insertElement.taskName && insertElement.taskName.trim()))
        return
      if(dbId){
        Vue.http.post('/updatetasks', {
                id: dbId,
                taskName: insertElement.taskName,
                taskDesc: '',
            }).then(response => {
              commit('UPDATE_TODO', insertElement)
              // console.log('task update', response.data)
          })
      }else{
        Vue.http.post('/tasks', {
                parentId: insertElement.parentId,
                taskName: insertElement.taskName,
                taskDesc: '',
                level: insertElement.level,
                completed: false, 
                index: insertElement.index,
                dueDate:'',
                createdAt: new Date().toJSON(),
                updatedAt: new Date().toJSON()
            })
            .then(function(response) {
              commit('addTodo', {"data":response.data, "todo": insertElement})
              // console.log("Response:", response)
        })
      }
    },
    editTaskName({commit}, editObject){
        if (editObject.todo.id) {
          Vue.http.post('/updatetasks', {
                    id: editObject.todo.id,
                    taskName: editObject.todo.taskName,
                    taskDesc: editObject.todo.taskDesc,
                    dueDate: editObject.selectedDate
                }).then(response => {
                  console.log('task updated', response.data)
              })
          } 
      },
    deleteTodo({ commit }, deleteElement){
      console.log(deleteElement)
      let dbId = deleteElement.id
      if(dbId){
        Vue.http.delete('/deteletask/'+ dbId, {
        }).then(response => {
              commit('deleteTodo', {"data":response.data, "todo": deleteElement})
              console.log('task deleted', response.data)
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
          })
        }
    },
    toggleTodo({ commit }, changeTodo) {
      // console.log(changeTodo)
      let dbId = changeTodo.todo.id
      if(dbId){
      Vue.http.post('/updatetasks', {
                  id: dbId,
                  completed: changeTodo.todo.completed
              }).then(response => {
                commit('toggleTodo', changeTodo)
                // console.log('task updated', response.data)
            })
      }
    },
    // load_prgress_bar({ commit }, todo_progressBar){
    //     console.log("todo_progressBar",todo_progressBar)
    //     commit('load_prgress_bar', todo_progressBar)
    // }
  },
  getters: {
    getTodoById: (state, getters) => {
      return function(id, level){
        return state.todolist.filter(todo => todo.parentId === id, todo => todo.level === level)
      }
    },
    parentIdArr: state => state.parentIdArr
  },
  plugins: [createPersistedState()]
})

