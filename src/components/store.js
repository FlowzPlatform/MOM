/* eslint-disable*/
import Vue from 'vue'
var fun = function(parentId, currentLevel)
{
    var todoArray = new Array();
    var ppid = parentId ? parentId : ''
    var pId = {'parentId': ppid}
    $.ajax({
        url:'/tasks_parentId',
        type:'post',
        data: pId,
        async: false,
        success:function(res){
            todoArray = res;
        },
        dataType: "json",
    }); 
    var tempTodo = {
        parentId:parentId,
        taskName: '',
        taskDesc: '',
        level: currentLevel+1,
        completed: false,
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON()
      }
        todoArray.push(tempTodo)
    return todoArray
}

export default {
  state: {
    visibility: 'all',
    todo1: fun,
  },
  filter: {
    all: function (todo1) {
      return todo1;
    }
    ,
    active: function (todo1) {
      return todo1.filter(function (todo) {
        return !todo.completed
      })
    },
    completed: function (todo1) {
      return todo1.filter(function (todo) {
        return todo.completed
      })
    }
  },
  // addTodo: function (currentlevel, parent_id) {   
  //   this.state.todos.push({ 
  //       parentId: parent_id,
  //       taskName: '',
  //       taskDesc: '',
  //       level: currentlevel,
  //       completed: false,
  //       createdAt: new Date().toJSON(),
  //       updatedAt: new Date().toJSON()
  //   })
  // },
}
