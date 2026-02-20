<template>
  <div>
    <!-- 操作栏 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon> 新增房屋
      </el-button>
      <el-button @click="fetchData">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </el-card>

    <!-- 房屋列表 -->
    <el-card shadow="never">
      <el-table :data="houseList" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="houseName" label="房屋名称" min-width="180" />
        <el-table-column prop="address" label="地址" min-width="250" />
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              title="确定删除该房屋吗？"
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
    </el-card>

    <!-- 新增房屋对话框 -->
    <el-dialog v-model="dialogVisible" title="新增房屋" width="480px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="房屋名称" prop="houseName">
          <el-input v-model="form.houseName" placeholder="例如：阳光花园3栋501" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="详细地址（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listHouses, createHouse, deleteHouse } from '../api/house'

const loading = ref(false)
const houseList = ref([])
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = ref({
  houseName: '',
  address: ''
})

const rules = {
  houseName: [{ required: true, message: '请输入房屋名称', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listHouses()
    houseList.value = res.data || []
  } finally {
    loading.value = false
  }
}

const openDialog = () => {
  form.value = { houseName: '', address: '' }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await createHouse(form.value)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    fetchData()
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  await deleteHouse(id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>