<template>
  <el-container style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside width="220px" style="background-color: #304156">
      <div class="logo">
        <el-icon :size="24" color="#409EFF"><HomeFilled /></el-icon>
        <span class="logo-text">水电费分摊系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/houses">
          <el-icon><House /></el-icon>
          <span>房屋管理</span>
        </el-menu-item>
        <el-menu-item index="/tenants">
          <el-icon><User /></el-icon>
          <span>租客管理</span>
        </el-menu-item>
        <el-menu-item index="/bills">
          <el-icon><Document /></el-icon>
          <span>账单管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #ebeef5; display: flex; align-items: center">
        <h2 style="margin: 0; color: #303133; font-size: 18px">{{ pageTitle }}</h2>
      </el-header>
      <el-main style="background-color: #f0f2f5; padding: 20px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => route.path)

const titleMap = {
  '/houses': '房屋管理',
  '/tenants': '租客管理',
  '/bills': '账单管理'
}

const pageTitle = computed(() => titleMap[route.path] || '水电费分摊系统')
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  border-bottom: 1px solid #3a4a5b;
}

.logo-text {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}
</style>