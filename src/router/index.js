import { createRouter, createWebHistory } from 'vue-router'
import HouseManage from '../views/HouseManage.vue'
import TenantManage from '../views/TenantManage.vue'
import BillingManage from '../views/BillingManage.vue'

const routes = [
  { path: '/', redirect: '/houses' },
  { path: '/houses', name: 'Houses', component: HouseManage },
  { path: '/tenants', name: 'Tenants', component: TenantManage },
  { path: '/bills', name: 'Bills', component: BillingManage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router