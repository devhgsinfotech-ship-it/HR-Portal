import CommonSelect from "@/core/common/commonSelect"
import { priority, Project, Status_Inprogress, Task_Tags } from "@/core/common/selectoption/selectoption"
import TagInput from "@/core/common/Taginput"
import CommonTextEditor from "@/core/common/textEditor"
import { DatePicker } from "antd"
import { useState } from "react"
import { Link } from "react-router"

const EmployeeDashboardModal = () => {
    const [tags, setTags] = useState<string[]>(["Jerald", "Andrew", "Philip", "Davis"]);
    const handleTagsChange = (newTags: string[]) => {
        setTags(newTags);
    };
    return (
        <>
            {/* Add Leaves */}
            <div className="modal fade" id="add_leaves">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Add Leave</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form>
                            <div className="modal-body pb-0">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Employee Name</label>
                                            <select className="select">
                                                <option>Select</option>
                                                <option>Anthony Lewis</option>
                                                <option>Brian Villalobos</option>
                                                <option>Harvey Smith</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Leave Type</label>
                                            <select className="select">
                                                <option>Select</option>
                                                <option>Medical Leave</option>
                                                <option>Casual Leave</option>
                                                <option>Annual Leave</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">From </label>
                                            <div className="input-icon-end position-relative">
                                                <input
                                                    type="text"
                                                    className="form-control datetimepicker"
                                                    placeholder="dd/mm/yyyy"
                                                />
                                                <span className="input-icon-addon">
                                                    <i className="ti ti-calendar text-gray-7" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">To </label>
                                            <div className="input-icon-end position-relative">
                                                <input
                                                    type="text"
                                                    className="form-control datetimepicker"
                                                    placeholder="dd/mm/yyyy"
                                                />
                                                <span className="input-icon-addon">
                                                    <i className="ti ti-calendar text-gray-7" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">No of Days</label>
                                            <input type="text" className="form-control" />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Remaining Days</label>
                                            <input type="text" className="form-control" />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Reason</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                defaultValue={""}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light me-2"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Leaves
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Add Leaves */}
            {/* Edit Task */}
            <div className="modal fade" id="edit_task">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Edit Task</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <label className="form-label">Todo Title</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                defaultValue="Patient appointment booking"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Due Date</label>
                                            <div className="input-icon-end position-relative">
                                                <DatePicker
                                                    className="form-control datetimepicker"
                                                    format={{
                                                        format: "DD-MM-YYYY",
                                                        type: "mask",
                                                    }}
                                                    placeholder="20-05-2025"
                                                />
                                                <span className="input-icon-addon">
                                                    <i className="ti ti-calendar text-gray-7" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Project</label>
                                            <CommonSelect
                                                className='select'
                                                options={Project}
                                                defaultValue={Project[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label me-2">Team Members</label>
                                            <TagInput
                                                initialTags={tags}
                                                onTagsChange={handleTagsChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Tag</label>
                                            <CommonSelect
                                                className='select'
                                                options={Task_Tags}
                                                defaultValue={Task_Tags[2]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Status</label>
                                            <CommonSelect
                                                className='select'
                                                options={Status_Inprogress}
                                                defaultValue={Status_Inprogress[2]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Priority</label>
                                            <CommonSelect
                                                className='select'
                                                options={priority}
                                                defaultValue={priority[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label">Who Can See this Task?</label>
                                        <div className="d-flex align-items-center">
                                            <div className="form-check me-3">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault4"
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault4"
                                                >
                                                    Public
                                                </label>
                                            </div>
                                            <div className="form-check me-3">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault5"
                                                    defaultChecked
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault5"
                                                >
                                                    Private
                                                </label>
                                            </div>
                                            <div className="form-check ">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault6"
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault6"
                                                >
                                                    Admin Only
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <label className="form-label">Descriptions</label>
                                            <CommonTextEditor />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label">Upload Attachment</label>
                                        <div className="bg-light rounded p-2">
                                            <div className="profile-uploader border-bottom mb-2 pb-2">
                                                <div className="drag-upload-btn btn btn-sm btn-white border px-3">
                                                    Select File
                                                    <input
                                                        type="file"
                                                        className="form-control image-sign"
                                                        multiple
                                                    />
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                                                <div className="d-flex align-items-center">
                                                    <h6 className="fs-12 fw-medium me-1">Logo.zip</h6>
                                                    <span className="badge badge-soft-info">21MB </span>
                                                </div>
                                                <Link to="#" className="btn btn-sm btn-icon">
                                                    <i className="ti ti-trash" />
                                                </Link>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <h6 className="fs-12 fw-medium me-1">Files.zip</h6>
                                                    <span className="badge badge-soft-info">25MB </span>
                                                </div>
                                                <Link to="#" className="btn btn-sm btn-icon">
                                                    <i className="ti ti-trash" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light me-2"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Edit Task */}
        </>
    )
}

export default EmployeeDashboardModal