import CommonSelect from "@/core/common/commonSelect"
import ImageWithBasePath from "@/core/common/imageWithBasePath"
import { Department, Designation } from "@/core/common/selectoption/selectoption"
import { Link } from "react-router"

const AgentModal = () => {
    return (
        <>
            {/* Add Client */}
            <div className="modal fade" id="add_agent">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Add New Agent</h4>
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
                            <div className="modal-body pb-0 ">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="d-flex align-items-center flex-wrap row-gap-3 w-100 rounded mb-4 p-3">
                                            <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                                                <i className="ti ti-photo" />
                                            </div>
                                            <div className="profile-upload">
                                                <div className="mb-2">
                                                    <h6 className="mb-1">Upload Profile Image</h6>
                                                    <p className="fs-12">Image should be below 4 mb</p>
                                                </div>
                                                <div className="profile-uploader d-flex align-items-center">
                                                    <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                                        Upload
                                                        <input
                                                            type="file"
                                                            className="form-control image-sign"
                                                            multiple
                                                        />
                                                    </div>
                                                    <Link
                                                        to="#"
                                                        className="btn btn-light btn-sm"
                                                    >
                                                        Cancel
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                First Name <span className="text-danger"> *</span>
                                            </label>
                                            <input type="text" className="form-control" />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Last Name</label>
                                            <input type="email" className="form-control" />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Phone Number<span className="text-danger"> *</span>
                                            </label>
                                            <input type="text" className="form-control" />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Email<span className="text-danger"> *</span>
                                            </label>
                                            <input type="text" className="form-control" />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Department<span className="text-danger"> *</span>
                                            </label>
                                            <CommonSelect
                                                className='select'
                                                options={Department}
                                                defaultValue={Department[0]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Designation<span className="text-danger"> *</span>
                                            </label>
                                            <CommonSelect
                                                className='select'
                                                options={Designation}
                                                defaultValue={Designation[0]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">About</label>
                                            <textarea className="form-control" defaultValue={""} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-light border me-2"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save{" "}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Add Client */}
            {/* Edit Client */}
            <div className="modal fade" id="edit_agent">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                Edit Agent{" "}
                                <span className="text-gray-6 fw-medium ms-3 fs-14">
                                    Agent ID : Agt -0017
                                </span>
                            </h4>
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
                            <div className="modal-body pb-0 ">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="d-flex align-items-center flex-wrap row-gap-3 w-100 rounded p-3 mb-4">
                                            <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                                                <ImageWithBasePath
                                                    src="assets/img/agents/agent-01.jpg"
                                                    className="rounded-circle"
                                                    alt="img"
                                                />
                                            </div>
                                            <div className="profile-upload">
                                                <div className="mb-2">
                                                    <h6 className="mb-1">Upload Profile Image</h6>
                                                    <p className="fs-12">Image should be below 4 mb</p>
                                                </div>
                                                <div className="profile-uploader d-flex align-items-center">
                                                    <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                                        Upload
                                                        <input
                                                            type="file"
                                                            className="form-control image-sign"
                                                            multiple
                                                        />
                                                    </div>
                                                    <Link
                                                        to="#"
                                                        className="btn btn-light btn-sm"
                                                    >
                                                        Cancel
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                First Name <span className="text-danger"> *</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                defaultValue="William"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Last Name</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                defaultValue="Parsons"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Phone Number<span className="text-danger"> *</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                defaultValue={+1456789023}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Email<span className="text-danger"> *</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                defaultValue="william@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Department<span className="text-danger"> *</span>
                                            </label>
                                            <CommonSelect
                                                className='select'
                                                options={Department}
                                                defaultValue={Department[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Designation<span className="text-danger"> *</span>
                                            </label>
                                            <CommonSelect
                                                className='select'
                                                options={Designation}
                                                defaultValue={Designation[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">About</label>
                                            <textarea className="form-control" defaultValue={""} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-light border me-2"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save{" "}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Edit Client */}
        </>
    )
}

export default AgentModal