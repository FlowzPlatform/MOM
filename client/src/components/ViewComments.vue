<template>
  <div id="details_pane_footer" class="details-pane-redesign details-pane-footer">
    <div class="dropdown sort-menu">
      <div class="dropdown">
        <button class="btn btn-defualt glyphicon glyphicon-cog setColor" type="button" data-toggle="dropdown"></button>
        <ul class="dropdown-menu">
          <li v-for="(val, key) in commentFilter">
            <a :href="'#/' + key" @click="getSortByName(key)">{{key | capitalizeFirstLetter}}</a>
          </li>
        </ul>
      </div>
    </div>
    <hr class="StoryFeed-separator StoryFeed-topSeparator">
    <div v-for="comment in taskSortComments">
      <div class="FeedBlockStory StoryFeed-blockStory">
        <div class="BlockStory">
          <div class="BlockStory-icon">
            <div v-if="comment.email">
              <avatar v-if="comment.image_url" :username="comment.email" :src="comment.image_url" :size="30"></avatar>
              <avatar v-else :username="comment.email" :size="30" color="#fff"></avatar>
            </div>
            <div v-if="visibleFilter === 'group_By'">
              <div v-if="comment.list[0].email">
                <avatar v-if="comment.list[0].image_url" :username="comment.list[0].email" :src="comment.list[0].image_url" :size="30"></avatar>
                <avatar v-else :username="comment.list[0].email" :size="30" color="#fff"></avatar>
              </div>
            </div>
          </div>
          <div class="BlockStory-block commentbox">
            <div class="BlockStory-header">
              <div class="BlockStory-headerContent">
                <span class="BlockStory-storyContent">
                  <strong>

                    <a v-if="visibleFilter === 'all'" class="DeprecatedNavigationLink BlockStory-actorLink">{{ getDisplayName(comment) }}</a>
                    <a v-else-if="visibleFilter === 'group_By'" class="DeprecatedNavigationLink BlockStory-actorLink">{{comment.fname | capitalizeFirstLetter}}</a>
                    
                  </strong>
                </span>
                <span class="BlockStory-metadata">
                  <span class="BlockStory-timestamp" :title="comment.createAt | parseDate">
                    <span>{{comment.createAt | parseDateAgo}}</span>
                  </span>
                </span>
              </div>
            </div>
            <div class="BlockStory-body">
              <div class="truncatedRichText">
                <div class="richText truncatedRichText-richText" v-html="comment.comment"></div>
                <div v-if="visibleFilter === 'group_By'" v-for="userComment in comment.list" v-html="userComment.comment">
                  <div class="richText truncatedRichText-richText">{{userComment.comment}}</div>
                  <span class="BlockStory-metadata">
                    <span class="BlockStory-timestamp" :title="comment.createAt | parseDate">
                      <span>{{userComment.createAt | parseDateAgo}}</span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="visibleFilter === 'all' " class="pull-right comment-delete" v-show="isDeleteComment">
              <span class="fa fa-close" @click="deleteCommnet(comment)"></span>
            </div>
            <div v-if="visibleFilter === 'all' " class="pull-right comment-delete">
              <span style="margin-right:5px;">{{comment.count ? comment.count :0}}</span>
              <span class="fa fa-reply" @click="replyCommentMethod(comment)"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>
<script>
/* eslint-disable*/
import { mapGetters } from "vuex";
import Avatar from 'vue-avatar/src/Avatar'
import Vue from "vue";
import moment from 'moment';
import * as services from '../services'
import CmnFunc from './CommonFunc.js'

  Vue.filter('parseDate', function (value) {
    if (value) {
      return moment(String(value)).calendar()
    }
  })
  Vue.filter('parseDateAgo', function (value) {
    if (value) {
      return moment(String(value)).fromNow()
    }
  })
  Vue.filter('capitalizeFirstLetter', function (str) {
    if (!str)
      return ""
    let str1 = str.split('_').join(' ')
    return str1.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
  })
  const commentFilter = {
    all: totalComment => _.sortBy(totalComment, function(o) { return new moment(o.createAt); }).reverse(),
    group_By: totalComment => _(totalComment).groupBy(x => x.fullname)
      .map((value, key) => ({ fname: key, list: value })).value()
  }

  export default {
    components: {
      Avatar
    },
    props: ['commentTaskId', 'commentParentId','id','isPinned'],
    data: function () {
      return {
        taskComments: [],
        taskSortComments: [],
        commentFilter: commentFilter,
        visibleFilter: 'all',
        isDeleteComment: true
      };
    },
    created: function () {
      services.taskComments.find({ query: { task_id: this.commentTaskId, parentId: this.commentParentId ? this.commentParentId : '' } }).then(response => {
         this.sortComment(response);
        this.getSubTaskComments();
        this.taskComments = this.taskSortComments.slice();
        // this.sortComment()
      });

      let vm = this;
      services.taskComments.on('created', message => {

        let indexCount = _.findIndex(this.taskComments, function (d) { return d.task_id == message.task_id && d.id == message.parentId })
        // Comment counter increament
        if (indexCount > -1) {
          this.taskComments[indexCount].count += 1
        } 
        
        if(this.commentParentId===message.parentId){
          // Add new comment
          let index = _.findIndex(this.taskSortComments, function (d) { return d.id == message.id })
          if (index < 0 && indexCount < 0) {
            this.setcommenteduserData(message);
            // this.taskSortComments.splice(0,0,message)
            // this.taskComments.splice(0,0,message)
            this.taskSortComments.unshift(message)
            this.taskComments.unshift(message)
          }
        
        
      }

      });
      services.taskComments.on('removed', message => {
        let indexCount = _.findIndex(this.taskComments, function (d) { return d.task_id == message.task_id && d.id == message.parentId })
        if (indexCount > -1) {
          this.taskComments[indexCount].count -= 1
        }

        // Remove comment
        let index = _.findIndex(this.taskSortComments, function (d) { return d.id == message.id })
        if (index > -1 && indexCount < 0) {
          this.taskSortComments.splice(index, 1)
          this.taskComments = this.taskSortComments.slice();
        }
      }
      );
    },
    methods: {
      getDisplayName(user) {
        return user.fullname ? user.fullname.charAt(0).toUpperCase() : user.email
      },
      replyCommentMethod(comment) {
        let parentList = this.$store.state.parentIdArr;
      let avaiIndex=_.findIndex(parentList, function (d) { return d.id === comment.id })
      console.log("avilIndex:-->",avaiIndex)
      if (avaiIndex < 0) {
        comment.show_type = 'subcomment'
        comment.parentId = this.commentParentId
        console.log("Click Comment:--", comment)

        let index;
        if (!comment.parentId) {
          index = _.findIndex(parentList, function (d) { return d.id === comment.task_id })
        } else {
          index = _.findIndex(parentList, function (d) { return d.id === comment.parentId})
        }

        let parentCounter=0;
        let lastCommentParentId=comment.parentId;
        parentList.forEach(element => {
          if(element.parentId ===  lastCommentParentId  ){
            lastCommentParentId=element.id;                 
            if(element.isPinned===undefined || !element.isPinned){
              console.log("IsPinned Not Found:--",parentCounter)
              this.$store.state.parentIdArr.splice(parentCounter, 1)
            }else{
             console.log("IsPinned Found:--",parentCounter)              
            }
          }
          parentCounter++;      
        });
       
        this.$store.state.parentIdArr.splice(index + 1, 0,comment)
        // Vue.set(this.$store.state.parentIdArr, index+1, comment)
        console.log("Paret Id arr",this.$store.state.parentIdArr)
      }
      },
      getSubTaskComments: function () {
        this.taskSortComments.forEach(function (c) {
          this.setcommenteduserData(c);
        }, this)
      },
      setcommenteduserData: function (c) {
        let userId = c.commentBy
        let userIndex = _.findIndex(this.$store.state.arrAllUsers, function (m) { return m._id === userId })
        if (userIndex < 0) {
        } else {
          var id = this.$store.state.arrAllUsers[userIndex]._id
          c.fullname = this.$store.state.arrAllUsers[userIndex].fullname
          c.image_url = this.$store.state.arrAllUsers[userIndex].image_url,
            c.email = this.$store.state.arrAllUsers[userIndex].email
        }
      },
      getSortByName: function (key) {
        this.visibleFilter = key
      },
      deleteCommnet: function (commentObj) {
        // this.$store.dispatch('delete_Comment', commentObj)
        this.$Modal.confirm({
          title: "Comment",
          content:
            "<p>Are you sure that you want to permanently delete Comment?</p>",
          onOk: () => {
            this.$store.dispatch('delete_Comment', commentObj)
          }
        });
      },
      sortComment:function(comments)
      {
        this.taskSortComments = commentFilter[this.visibleFilter](comments);
      }
    },
    watch: {
      commentTaskId: function () {
        this.taskComments.length=0
        this.taskSortComments.length=0
        services.taskComments.find({ query: { task_id: this.commentTaskId, parentId: this.commentParentId ? this.commentParentId : '' } }).then(response => {
          this.sortComment(response);
          this.getSubTaskComments();
        });
      },
      commentParentId: function () {
        this.taskComments.length=0
        this.taskSortComments.length=0
        services.taskComments.find({ query: { task_id: this.commentTaskId, parentId: this.commentParentId ? this.commentParentId : '' } }).then(response => {
          this.sortComment(response);;
          this.getSubTaskComments();

        });
      },
      visibleFilter: function () {
        this.sortComment(this.taskComments);
        // this.taskSortComments = commentFilter[this.visibleFilter](this.taskComments);
      },
      isPinned:function()
      {

      }
    },
    computed: {
      capitalizeLetters: function () {
        var str = this.$store.state.userObject.email;
        var firstLetters = str.substr(0, 2);
        return firstLetters.toUpperCase();
      }
    }
  };
</script>