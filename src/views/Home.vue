<template>
  <div class="home" v-if="!$auth.loading">
    <p>Hello: {{ userInfo().id }}</p>
    <Checks/>
  </div>
</template>

<script>
import gql from 'graphql-tag';

export const GET_USER_INFO = gql`
  query getUserInfo {
    userInfos: users(limit: 1) {
      id
    }
  }
`;

export default {
  name: 'Home',
  components: {
  },
  data() {
    return {
      userInfos: [{}],
    };
  },
  methods: {
    userInfo() {
      return this.userInfos[0];
    },
  },
  apollo: {
    userInfos: {
      query: GET_USER_INFO,
    },
  },
};
</script>
