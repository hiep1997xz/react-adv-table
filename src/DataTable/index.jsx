import { SearchOutlined } from '@ant-design/icons'
import { Button, Form, Input, Popconfirm, Space, Table } from 'antd'
import axios from 'axios'
import { isEmpty } from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'

// Drag n Drop
import update from 'immutability-helper'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

// export
import { CSVLink } from 'react-csv'

const DataTable = () => {
  const [gridData, setGirdData] = useState([])
  const [loading, setLoading] = useState(false)
  const [editRowKey, setEditRowKey] = useState('')
  const [sortInfo, setSortInfo] = useState({})
  const [searchText, setSearchText] = useState('')
  const [searchColText, setSearchColText] = useState('')
  const [searchedCol, setSearchedCol] = useState('')
  //filter coloumn age
  const [filteredInfo, setFilteredInfo] = useState({})

  let [filteredData] = useState()
  const [form] = Form.useForm()

  //Drag n Drop
  const type = 'DraggableBodyRow'
  const tableRef = useRef()

  const DraggableBodyRow = ({
    index,
    moveRow,
    className,
    style,
    ...restProps
  }) => {
    const ref = useRef()
    const [{ isOver, dropClassName }, drop] = useDrop({
      accept: type,
      collect: (monitor) => {
        const { index: dragIndex } = monitor.getItem() || {}
        if (dragIndex === index) {
          return {}
        }

        return {
          isOver: monitor.isOver(),
          dropClassName:
            dragIndex < index ? 'drop-down-downward' : 'drop-over-upward',
        }
      },
      drop: (item) => {
        moveRow(item.index, index)
      },
    })
    const [, drag] = useDrag({
      type,
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })
    drop(drag(ref))
    return (
      <tr
        ref={ref}
        className={`${className} ${isOver ? dropClassName : ''}`}
        style={{ cursor: 'move', ...style }}
        {...restProps}
      />
    )
  }

  const moveRow = useCallback((dragIndex, hoverIndex) => {
    const dragRow = modifiedData[dragIndex]
    setGirdData(
      update(modifiedData, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRow],
        ],
      })
    )
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const res = await axios.get('https://jsonplaceholder.typicode.com/comments')
    setGirdData(res.data)
    setLoading(false)
  }

  const dataWithAge = gridData.map((item) => ({
    ...item,
    age: Math.floor(Math.random() * 6) + 20,
  }))

  const modifiedData = dataWithAge.map(({ body, ...item }) => ({
    ...item,
    key: item.id,

    // Expandable Row
    info: `My name is ${item.name.split('@')[0]} and i am ${item.age} year old`,

    message: isEmpty(body) ? item.message : body,
  }))

  const isEditing = (value) => {
    return value.key === editRowKey
  }

  const handleChange = (_, filter, sorter) => {
    const { order, field } = sorter

    //filter coloumn age
    setFilteredInfo(filter)

    setSortInfo({ columnKey: field, order })
  }

  const getColumnSearchProps = (dataIndex) => ({
    filterDropDown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 0, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}>
            Search
          </Button>
          <Button
            onClick={() => handleResetCol(clearFilters)}
            size="small"
            style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : '',
    render: (text) =>
      searchedCol === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchColText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  })

  const handleSearchCol = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchColText(selectedKeys[0])
    setSearchedCol(dataIndex)
  }

  const handleResetCol = (clearFilters) => {
    clearFilters()
    setSearchColText('')
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      align: 'center',
      editTable: true,
      sorter: (a, b) => a.name.length - b.name.length,
      sortOrder: sortInfo.columnKey === 'name' && sortInfo.order,
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      align: 'center',
      editTable: true,
      sorter: (a, b) => a.email.length - b.email.length,
      sortOrder: sortInfo.columnKey === 'email' && sortInfo.order,
      ...getColumnSearchProps('email'),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      align: 'center',
      editTable: false,
      sorter: (a, b) => a.age.length - b.age.length,
      sortOrder: sortInfo.columnKey === 'age' && sortInfo.order,
      //filter coloumn age
      filters: [
        { text: '20', value: '20' },
        { text: '21', value: '21' },
        { text: '22', value: '22' },
        { text: '23', value: '23' },
        { text: '24', value: '24' },
        { text: '25', value: '25' },
      ],
      filteredValue: filteredInfo.age || null,
      onFilter: (value, record) => String(record.age).includes(value),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      align: 'center',
      editTable: true,
      sorter: (a, b) => a.message.length - b.message.length,
      sortOrder: sortInfo.columnKey === 'message' && sortInfo.order,
      ...getColumnSearchProps('message'),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      align: 'center',
      render: (_, record) => {
        const editTable = isEditing(record)

        return modifiedData.length >= 1 ? (
          <Space>
            <Popconfirm
              title="Are you sure want to delete ?"
              onConfirm={() => handleDelete(record)}>
              <Button danger type="primary" disabled={editTable}>
                Delete
              </Button>
            </Popconfirm>
            {editTable ? (
              <sapn>
                <Space size="middle">
                  <Button
                    onClick={() => save(record.key)}
                    type="primary"
                    style={{ marginRight: 8 }}>
                    Save
                  </Button>
                  <Popconfirm title="Are sure to cancel ?" onConfirm={cancel}>
                    <Button>Cancel</Button>
                  </Popconfirm>
                </Space>
              </sapn>
            ) : (
              <Button onClick={() => edit(record)} type="primary">
                Edit
              </Button>
            )}
          </Space>
        ) : null
      },
    },
  ]

  const handleDelete = (value) => {
    const dataSoure = [...modifiedData]
    const filteredData = dataSoure.filter((item) => item.id !== value.id)
    setGirdData(filteredData)
  }

  const cancel = () => {
    setEditRowKey('')
  }

  const save = async (key) => {
    try {
      const row = await form.validateFields()
      const newData = [...modifiedData]
      const index = newData.findIndex((item) => key === item.key)
      if (index > -1) {
        const item = newData[index]
        newData.splice(index, 1, { ...item, ...row })
        setGirdData(newData)
        setEditRowKey('')
      }
    } catch (error) {
      console.log(error)
    }
  }

  const edit = (record) => {
    form.setFieldsValue({
      name: '',
      email: '',
      message: '',
      ...record,
    })
    setEditRowKey(record.key)
  }

  const mergedColummns = columns.map((col) => {
    if (!col.editTable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    }
  })

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    record,
    children,
    ...restProps
  }) => {
    const input = <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `Please inout some value in ${title} field`,
              },
            ]}>
            {input}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    )
  }

  const reset = () => {
    setSortInfo({})

    //filter coloumn age
    setFilteredInfo({})

    setSearchText('')
    loadData()
  }

  const handleInputChage = (e) => {
    setSearchText(e.target.value)
    if (e.target.value === '') {
      loadData()
    }
  }

  const globalSearch = () => {
    filteredData = modifiedData.filter((value) => {
      return (
        value.name.toLowerCase().includes(searchText.toLowerCase()) ||
        value.email.toLowerCase().includes(searchText.toLowerCase()) ||
        value.message.toLowerCase().includes(searchText.toLowerCase())
      )
    })

    setGirdData(filteredData)
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Enter search text"
          value={searchText}
          allowClear
          type="text"
          onChange={handleInputChage}
        />
        <Button onClick={globalSearch} type="primary">
          Search
        </Button>
        <Button onClick={reset}>Reset</Button>
        <Button style={{ backgroundColor: "#c2115e", color: "#fff" }}>
          <CSVLink
            data={
              filteredData && filteredData.length ? filteredData : modifiedData
            }>Export</CSVLink>
        </Button>
      </Space>
      <Form form={form} component={false}>
        {/* //Drag n Drop DndProvider */}
        <DndProvider backend={HTML5Backend}>
          <Table
            ref={tableRef}
            columns={mergedColummns}
            components={{
              body: {
                cell: EditableCell,

                // Drag n Drop
                row: DraggableBodyRow,
              },
            }}
            // Drag n Drop
            onRow={(record, index) => ({
              index,
              moveRow,
            })}
            dataSource={
              filteredData && filteredData.length ? filteredData : modifiedData
            }
            //Expandable Row
            expandable={{
              expandedRowRender: (record) => (
                <p style={{ margin: 0 }}>{record.info}</p>
              ),
              rowExpandable: (record) => record.info !== 'Not Expandable',
            }}
            bordered
            loading={loading}
            onChange={handleChange}
          />
        </DndProvider>
      </Form>
    </div>
  )
}

export default DataTable
