import React, { useState } from "react";
import CommonSelect from "../common/commonSelect";
import { DatePicker } from "antd";
import apiClient from "../utils/apiClient";

interface HolidaysModalProps {
  onAddSuccess?: () => void;
}

const HolidaysModal: React.FC<HolidaysModalProps> = ({ onAddSuccess }) => {
    const [title, setTitle] = useState('');
    const [holidayDate, setHolidayDate] = useState<any>(null);
    const [description, setDescription] = useState('');
    const [isNational, setIsNational] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const status = [
        { value: "Public", label: "Public" },
        { value: "National", label: "National" },
    ];
    
    const getModalContainer = () => {
        const modalElement = document.getElementById("modal-datepicker");
        return modalElement ? modalElement : document.body;
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await apiClient.post('/holidays', {
          title,
          holidayDate: holidayDate ? holidayDate.format('YYYY-MM-DD') : null,
          description,
          isNational
        });
        
        // Reset form
        setTitle('');
        setHolidayDate(null);
        setDescription('');
        setIsNational(false);
        setErrorMsg('');
        
        // Close modal and refresh
        const closeBtn = document.querySelector('#add_holiday .btn-close') as HTMLButtonElement;
        if (closeBtn) closeBtn.click();
        
        if (onAddSuccess) onAddSuccess();
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error adding holiday');
      }
    };

  return (
    <>
      {/* Add Plan */}
      <div className="modal fade" id="add_holiday">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Holiday</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddHoliday}>
              <div className="modal-body pb-0">
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input type="text" className="form-control" required value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Date</label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          value={holidayDate}
                          onChange={(date) => setHolidayDate(date)}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Type</label>
                      <CommonSelect
                        className="select"
                        options={status}
                        defaultValue={status[0]}
                        onChange={(opt) => setIsNational(opt?.value === 'National')}
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
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Plan */}
      {/* Edit Plan */}
      <div className="modal fade" id="edit_holiday">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Holiday</h4>
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
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="New Year"
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Date</label>
                      <div className="input-icon-end position-relative">
                      <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        defaultValue={"First day of the new year"}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={status}
                        defaultValue={status[1]}
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
                <button type="button" data-bs-dismiss="modal" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Plan */}
    </>
  );
};

export default HolidaysModal;
