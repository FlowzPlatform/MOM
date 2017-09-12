/* eslint-disable*/
import { store } from '../VuexSession'
import * as services from '../services'
import * as Constant from './Constants.js'
import axios from 'axios'


export default {
    // Check validations
  checkBlankField: function (text) {
    if (text.length === 0) {
      return false
    } else {
      return true
    }
  },
  checkValidEmail: function (emailId) {
    var filter = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
    if (filter.test(emailId)) {
        return true
    } else {
        return false
    }
  },
  matchPassword: function (pwd, confPwd) {
      if (pwd == confPwd) {
          return true
      }
      return false
  },
    deleteAutheticationDetail: function () {
      store.commit('DELETE_USERTOKEN')
      store.commit('DELETE_ATTACHMENTS')
      store.commit('DELETE_ALLUSERSLIST')
      store.state.userObject = {}
      store.state.isAuthorized = false
      store.commit('userData')
      store.commit('authorize')
      
  },
  resetProjectDefault: function () {
   store.commit('CLEAR_PROJECT_DEFAULT')
   store.state={}
   store.state.userObject = {}
   store.state.isAuthorized = false
   store.state.todolist = []
   store.state.parentIdArr = []
   // state.progress_count = ''
   store.state.visibility = 'active'
   store.state.arrAttachment = []
   store.state.isLoading = false
   store.state.settingsObject = []
   store.state.taskComment = []
   store.state.taskTags = []
   store.state.tagsList = []
   store.state.isProgress = false
   store.state.isDueDate = false
   store.state.todoObjectByID = {}
   store.state.userToken = ''
   store.state.isSliderOpen = false
   store.state.currentTodoObj = {}
   store.state.currentModified = false
   store.state.isDeleteObj = false
   store.state.deleteItemsSelected = false
   store.state.deletedTaskArr = []
   store.state.arrAllUsers = []
   store.state.projectlist = []
   store.state.userRoles = []
   store.state.currentProjectId = undefined
   store.state.currentProjectName = undefined
   store.state.currentProjectPrivacy = ''
   store.state.projectSettingId= 0
   store.state.currentProjectMember= ''
   store.state.currentProject={}
   store.state.projectSettingMenuOffset= 0
   store.state.createdByTaskList= []
   store.state.recentlyCompletedTasks= []
   store.state.searchView= ''
   store.state.assignedToOthers= [],
   store.state.taskIndex= -1
   store.state.task_types_list= []
   store.state.task_state_list= []
   store.state.task_types_state= []
   store.state.googleId= ''
   store.state.removeMember={}
   store.state.permissions={}
   store.state.currentProjectRoleid=''
   
  },
  isCreatePermission: function(accessValue){
    return accessValue >= 8
  },
  isReadPermission: function(accessValue){
    const readValue = [4, 5, 6, 7, 12, 13, 14, 15];
    return readValue.includes(accessValue)
  },
  isUpdatePermision: function(accessValue){
    const updatevalue = [2, 3, 6, 7, 10, 11, 14, 15]
    return updatevalue.includes(accessValue)
  },
  isDeletePermision: function(accessValue){
    const deletevalue = [1, 3, 5, 7, 9, 11, 13, 15]
    return deletevalue.includes(accessValue)
  },
  checkActionPermision:async function(context,taskTypeId,userAction,permisisonAction,TAG)
  {
      var self = context;
      let selfRoleId = this.getSelfRoleId(context);
      console.log("selfRoleId:--"+TAG,selfRoleId)
      if(selfRoleId)
        {
          let permisisonId = this.getPermissionId(context,userAction)
          console.log("permisisonId--->"+TAG, permisisonId)

          //  await services.roleAccessService.find({ query: { task_type: taskTypeId, rId: selfRoleId } }).then(response => {
          //   console.log("Res--->", response)
            let accessRight =await this.callRoleAccessService(taskTypeId,selfRoleId,TAG);
            // let accessRight =response;
            console.log("accessRight--->", accessRight)

            if (accessRight && accessRight.length > 0) {
              let accessValue = this.getAccessValue(context, accessRight, permisisonId, taskTypeId)
              console.log("accessValue--->", accessValue)
              if (permisisonAction === Constant.PERMISSION_ACTION.CREATE)
                return this.isCreatePermission(accessValue);
              else if (permisisonAction === Constant.PERMISSION_ACTION.READ)
                return this.isReadPermission(accessValue);
              else if (permisisonAction === Constant.PERMISSION_ACTION.UPDATE)
                return this.isUpdatePermision(accessValue);
              else
                return this.isDeletePermision(accessValue);
            }else{
              return this.isCreatedByLoginUser(context);  
            }
          // });
        }
        else{
          return this.isCreatedByLoginUser(context);
        }


  },
  isCreatedByLoginUser:function(context)
  {
      return context.$store.state.currentProject.create_by === context.$store.state.userObject._id
  },
  callRoleAccessService:function(taskTypeId,selfRoleId)
  {
    console.log('taskTypeId--->', taskTypeId)
    console.log('selfRoleId:::'+TAG, selfRoleId)
    return services.roleAccessService.find({ query: { task_type: taskTypeId, rId: selfRoleId } }).then(response => {
      console.log("Res--->", response)
      return response;
      
    });
  },
  getSelfRoleId:function(context)
  {
    console.log("context.$store.state.currentProjectMember",context.$store.state.currentProjectMember)
    console.log("context.$store.state.userObject._id",context.$store.state.userObject._id)
    
    return _.result(_.find(context.$store.state.currentProjectMember, function (obj) {
      return obj.user_id === context.$store.state.userObject._id;
    }), 'user_role_id');
  },
  getPermissionId:function(context,user_action)
  {
    return _.result(_.find(context.$store.state.permissions, function (obj) {
      return obj.index == user_action;
    }), 'id');
  },
  getAccessValue:function(context,accessRight,permissionId,taskTypeId){
    return _.result(_.find(accessRight, function (obj) {
      return obj.pId === permissionId && obj.task_type === taskTypeId;
    }), 'access_value');
  },

  insertHistoryLog:function(context,createdBy,text,taskId,logAction)
  {
    services.taskHistoryLogs.create({created_by:createdBy,text:text,task_id:taskId,log_action:logAction,created_on:new Date()}).then(response=> {
      console.log("Reponse task update:--->",response)
      context.state.taskHistoryLog.push(response)
    })
  }
}
