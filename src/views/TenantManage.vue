<template>
  <div>
    <!-- 操作栏 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-select
            v-model="selectedHouseId"
            placeholder="按房屋筛选"
            clearable
            style="width: 100%"
            @change="fetchData"
          >
            <el-option
              v-for="h in houseList"
              :key="h.id"
              :label="h.houseName"
              :value="h.id"
            />
          </el-select>
        </el-col>
        <el-col :span="16">
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon> 添加租客
          </el-button>
          <el-button @click="fetchData">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 租客列表 -->
    <el-card shadow="never">
      <el-table 
        :data="tenantList" 
        v-loading="loading" 
        stripe 
        border 
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" sortable="custom" />
        <el-table-column prop="houseId" label="房屋ID" width="80" align="center" />
        <el-table-column label="所属房屋" min-width="150">
          <template #default="{ row }">
            {{ getHouseName(row.houseId) }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="120" sortable="custom" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="checkInDate" label="入住日期" width="120" align="center" sortable="custom" />
        <el-table-column prop="checkOutDate" label="退房日期" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="!row.checkOutDate" type="success" size="small">在住</el-tag>
            <span v-else>{{ row.checkOutDate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.checkOutDate"
              type="warning"
              size="small" link
              @click="openCheckoutDialog(row)"
            >
              <el-icon><SwitchButton /></el-icon> 退房
            </el-button>
            <el-popconfirm
              title="确定删除该租客吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" size="small" link>
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div style="margin-top: 16px; display: flex; justify-content: flex-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加租客对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加租客" width="500px" destroy-on-close>
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="90px">
        <el-form-item label="所属房屋" prop="houseId">
          <el-select v-model="addForm.houseId" placeholder="请选择房屋" style="width: 100%">
            <el-option
              v-for="h in houseList"
              :key="h.id"
              :label="h.houseName"
              :value="h.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="addForm.name" placeholder="租客姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addForm.phone" placeholder="手机号（选填）" />
        </el-form-item>
        <el-form-item label="入住日期" prop="checkInDate">
          <el-date-picker
            v-model="addForm.checkInDate"
            type="date"
            placeholder="选择入住日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 退房对话框 -->
    <el-dialog v-model="checkoutDialogVisible" title="租客退房" width="420px" destroy-on-close>
      <el-form :model="checkoutForm" ref="checkoutFormRef" label-width="90px">
        <el-form-item label="租客姓名">
          <el-input :model-value="checkoutForm.name" disabled />
        </el-form-item>
        <el-form-item label="退房日期" prop="checkOutDate"
          :rules="[{ required: true, message: '请选择退房日期', trigger: 'change' }]"
        >
          <el-date-picker
            v-model="checkoutForm.checkOutDate"
            type="date"
            placeholder="选择退房日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkoutDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCheckout">确认退房</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listTenants, listTenantsByHouse, addTenant, checkoutTenant, deleteTenant } from '../api/tenant'
import { listHouses } from '../api/house'

const loading = ref(false)
const submitting = ref(false)
const tenantList = ref([])
const houseList = ref([])
const selectedHouseId = ref(null)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 排序相关
const sortProp = ref(null)
const sortOrder = ref(null)

// ---------- 添加租客 ----------
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = ref({
  houseId: null,
  name: '',
  phone: '',
  checkInDate: ''
})
const addRules = {
  houseId: [{ required: true, message: '请选择房屋', trigger: 'change' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  checkInDate: [{ required: true, message: '请选择入住日期', trigger: 'change' }]
}

// ---------- 退房 ----------
const checkoutDialogVisible = ref(false)
const checkoutFormRef = ref(null)
const checkoutForm = ref({
  id: null,
  name: '',
  checkOutDate: ''
})

// 获取房屋名称
const getHouseName = (houseId) => {
  const house = houseList.value.find((h) => h.id === houseId)
  return house ? house.houseName : houseId
}

// 加载数据
const fetchHouses = async () => {
  const res = await listHouses()
  houseList.value = res.data || []
}

const fetchData = async () => {
  loading.value = true
  console.log('[Debug] Fetching tenants with params:', {
    current: currentPage.value,
    size: pageSize.value,
    prop: sortProp.value,
    order: sortOrder.value
  })

  try {
    const params = {
      current: currentPage.value,
      size: pageSize.value,
      prop: sortProp.value,
      order: sortOrder.value
    }
    
    let res
    if (selectedHouseId.value) {
      res = await listTenantsByHouse(selectedHouseId.value, params)
    } else {
      res = await listTenants(params)
    }
    
    console.log('[Debug] Tenants Response:', res)

    // 严谨的数据提取逻辑
    let finalData = []
    let finalTotal = 0

    // 探测路径 1: res.data.list (针对您的后端结构)
    if (res?.data?.list) {
      finalData = res.data.list
      finalTotal = res.data.total
    } 
    // 探测路径 2: res.data.records (MyBatis-Plus 默认)
    else if (res?.data?.records) {
      finalData = res.data.records
      finalTotal = res.data.total
    } 
    // 探测路径 3: res.list (拦截器已剥离 data)
    else if (res?.list) {
      finalData = res.list
      finalTotal = res.total
    }
    // 探测路径 4: res.records
    else if (res?.records) {
      finalData = res.records
      finalTotal = res.total
    }
    // 探测路径 5: res.data 为数组
    else if (Array.isArray(res?.data)) {
      finalData = res.data
      finalTotal = res.data.length
    }
    // 探测路径 6: res 本身为数组
    else if (Array.isArray(res)) {
      finalData = res
      finalTotal = res.length
    }

    tenantList.value = finalData
    total.value = Number(finalTotal) || 0
    
    console.log('[Debug] Final tenantList:', tenantList.value)
  } catch (error) {
    console.error('获取租客列表失败:', error)
    tenantList.value = []
    total.value = 0
    ElMessage.error('获取数据失败，请检查网络或后端接口')
  } finally {
    loading.value = false
  }
}

const handleSortChange = ({ prop, order }) => {
  sortProp.value = prop
  sortOrder.value = order
  currentPage.value = 1 // 排序改变后通常回到第一页
  fetchData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

const openAddDialog = () => {
  addForm.value = { houseId: selectedHouseId.value, name: '', phone: '', checkInDate: '' }
  addDialogVisible.value = true
}

const handleAdd = async () => {
  const valid = await addFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await addTenant(addForm.value)
    ElMessage.success('添加成功')
    addDialogVisible.value = false
    fetchData()
  } finally {
    submitting.value = false
  }
}

const openCheckoutDialog = (row) => {
  checkoutForm.value = { id: row.id, name: row.name, checkOutDate: '' }
  checkoutDialogVisible.value = true
}

const handleCheckout = async () => {
  const valid = await checkoutFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await checkoutTenant(checkoutForm.value.id, checkoutForm.value.checkOutDate)
    ElMessage.success('退房成功')
    checkoutDialogVisible.value = false
    fetchData()
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  await deleteTenant(id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(() => {
  fetchHouses()
  fetchData()
})
</script>