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
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon> 录入账单
          </el-button>
          <el-button @click="fetchData">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 账单列表 -->
    <el-card shadow="never">
      <el-table :data="billList" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="所属房屋" min-width="150">
          <template #default="{ row }">
            {{ getHouseName(row.houseId) }}
          </template>
        </el-table-column>
        <el-table-column prop="utilityType" label="费用类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.utilityType] || 'info'" size="small">
              {{ typeNameMap[row.utilityType] || row.utilityType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="billingStartDate" label="账期开始" width="120" align="center" />
        <el-table-column prop="billingEndDate" label="账期结束" width="120" align="center" />
        <el-table-column prop="totalAmount" label="总金额(元)" width="120" align="right" />
        <el-table-column prop="totalUsage" label="总用量" width="100" align="right" />
        <el-table-column prop="createdAt" label="录入时间" width="180" align="center" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openDetailDialog(row.id)">
              <el-icon><View /></el-icon> 分摊详情
            </el-button>
            <el-popconfirm
              title="确定删除该账单吗？"
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

    <!-- 录入账单对话框 -->
    <el-dialog v-model="createDialogVisible" title="录入账单" width="560px" destroy-on-close>
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="所属房屋" prop="houseId">
          <el-select v-model="createForm.houseId" placeholder="请选择房屋" style="width: 100%">
            <el-option
              v-for="h in houseList"
              :key="h.id"
              :label="h.houseName"
              :value="h.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="费用类型" prop="utilityType">
          <el-select v-model="createForm.utilityType" placeholder="请选择费用类型" style="width: 100%">
            <el-option label="电费" value="ELECTRICITY" />
            <el-option label="水费" value="WATER" />
            <el-option label="燃气费" value="GAS" />
          </el-select>
        </el-form-item>
        <el-form-item label="账期" prop="billingDateRange">
          <el-date-picker
            v-model="createForm.billingDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="总金额(元)" prop="totalAmount">
          <el-input-number
            v-model="createForm.totalAmount"
            :precision="2"
            :min="0"
            :step="10"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="总用量" prop="totalUsage">
          <el-input-number
            v-model="createForm.totalUsage"
            :precision="2"
            :min="0"
            controls-position="right"
            style="width: 100%"
            placeholder="选填"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">提交并计算分摊</el-button>
      </template>
    </el-dialog>

    <!-- 分摊详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="账单分摊详情" width="850px" destroy-on-close>
      <div v-loading="detailLoading">
        <template v-if="billDetail">
          <el-descriptions :column="2" border style="margin-bottom: 20px">
            <el-descriptions-item label="账单ID">{{ billDetail.billId }}</el-descriptions-item>
            <el-descriptions-item label="费用类型">
              {{ typeNameMap[billDetail.utilityType] || billDetail.utilityType }}
            </el-descriptions-item>
            <el-descriptions-item label="账期开始">{{ billDetail.billingStartDate }}</el-descriptions-item>
            <el-descriptions-item label="账期结束">{{ billDetail.billingEndDate }}</el-descriptions-item>
            <el-descriptions-item label="总金额(元)" :span="2">
              <span style="font-size: 18px; font-weight: bold; color: #e6a23c">
                ¥ {{ billDetail.totalAmount }}
              </span>
            </el-descriptions-item>
          </el-descriptions>

          <h4 style="margin-bottom: 12px; color: #303133">分摊明细</h4>
          <el-table :data="billDetail.allocations" stripe border>
            <el-table-column prop="tenantName" label="租客姓名" width="120" />
            <el-table-column label="租住日期" width="220" align="center">
              <template #default="{ row }">
                <span style="font-size: 13px">
                  {{ row.stayStartDate || '-' }} 至 {{ row.stayEndDate || '至今' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="residenceDays" label="居住天数" width="100" align="center" />
            <el-table-column prop="totalPersonDays" label="总人·天" width="100" align="center" />
            <el-table-column label="分摊比例" width="100" align="center">
              <template #default="{ row }">
                {{ ((row.residenceDays / row.totalPersonDays) * 100).toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column label="分摊金额(元)" min-width="150" align="right">
              <template #default="{ row }">
                <span style="font-weight: bold; color: #f56c6c">¥ {{ row.allocatedAmount }}</span>
              </template>
            </el-table-column>
          </el-table>

          <h4 style="margin-top: 24px; margin-bottom: 12px; color: #303133">租客分摊总计</h4>
          <el-table :data="tenantSummary" stripe border style="width: 100%">
            <el-table-column prop="tenantName" label="租客姓名" />
            <el-table-column label="总计分摊金额(元)" align="right">
              <template #default="{ row }">
                <span style="font-weight: bold; color: #409eff">¥ {{ row.totalAmount }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { listBills, listBillsByHouse, createBill, getBillDetail, deleteBill } from '../api/billing'
import { listHouses } from '../api/house'

const loading = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)
const billList = ref([])
const houseList = ref([])
const selectedHouseId = ref(null)

const typeNameMap = { ELECTRICITY: '电费', WATER: '水费', GAS: '燃气费' }
const typeTagMap = { ELECTRICITY: 'warning', WATER: '', GAS: 'danger' }

// ---------- 录入账单 ----------
const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = ref({
  houseId: null,
  utilityType: '',
  billingDateRange: [],
  totalAmount: null,
  totalUsage: null,
  remark: ''
})
const createRules = {
  houseId: [{ required: true, message: '请选择房屋', trigger: 'change' }],
  utilityType: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  billingDateRange: [{ required: true, message: '请选择账期', trigger: 'change' }],
  totalAmount: [{ required: true, message: '请输入总金额', trigger: 'blur' }]
}

// ---------- 分摊详情 ----------
const detailDialogVisible = ref(false)
const billDetail = ref(null)

// 计算同名租客的总分摊金额
const tenantSummary = computed(() => {
  if (!billDetail.value || !billDetail.value.allocations) return []
  const summaryMap = {}
  billDetail.value.allocations.forEach((item) => {
    if (!summaryMap[item.tenantName]) {
      summaryMap[item.tenantName] = 0
    }
    summaryMap[item.tenantName] += item.allocatedAmount
  })
  return Object.keys(summaryMap).map((name) => ({
    tenantName: name,
    totalAmount: summaryMap[name].toFixed(2)
  }))
})

const getHouseName = (houseId) => {
  const house = houseList.value.find((h) => h.id === houseId)
  return house ? house.houseName : houseId
}

const fetchHouses = async () => {
  const res = await listHouses()
  houseList.value = res.data || []
}

const fetchData = async () => {
  loading.value = true
  try {
    let res
    if (selectedHouseId.value) {
      res = await listBillsByHouse(selectedHouseId.value)
    } else {
      res = await listBills()
    }
    billList.value = res.data || []
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  createForm.value = {
    houseId: selectedHouseId.value,
    utilityType: '',
    billingDateRange: [],
    totalAmount: null,
    totalUsage: null,
    remark: ''
  }
  createDialogVisible.value = true
}

const handleCreate = async () => {
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return

  const payload = {
    houseId: createForm.value.houseId,
    utilityType: createForm.value.utilityType,
    billingStartDate: createForm.value.billingDateRange[0],
    billingEndDate: createForm.value.billingDateRange[1],
    totalAmount: createForm.value.totalAmount,
    totalUsage: createForm.value.totalUsage,
    remark: createForm.value.remark
  }

  submitting.value = true
  try {
    const res = await createBill(payload)
    ElMessage.success('账单录入成功，分摊计算完成')
    createDialogVisible.value = false
    fetchData()
    // 自动打开分摊详情
    billDetail.value = res.data
    detailDialogVisible.value = true
  } finally {
    submitting.value = false
  }
}

const openDetailDialog = async (billId) => {
  detailDialogVisible.value = true
  detailLoading.value = true
  billDetail.value = null
  try {
    const res = await getBillDetail(billId)
    billDetail.value = res.data
  } finally {
    detailLoading.value = false
  }
}

const handleDelete = async (id) => {
  await deleteBill(id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(() => {
  fetchHouses()
  fetchData()
})
</script>