import json
import hdf5storage

mat_fname = "/home/mcao/projects/velocityfields/data/pvf/Lang/MEG/sub-003/PVF/sub-003_MEG_holmes_WholeTrial_20251014123935"

data_dict = hdf5storage.loadmat(f"{mat_fname}.mat")

# save_json_data_dict                        = {}
# save_json_data_dict['params']              = data_dict['params']
# save_json_data_dict['gen_time']            = data_dict['gen_time']
# save_json_data_dict['Vx']                  = data_dict['Vx'].tolist()
# save_json_data_dict['Vy']                  = data_dict['Vy'].tolist()
# save_json_data_dict['Vz']                  = data_dict['Vz'].tolist()
# save_json_data_dict['volume_mask']         = data_dict['volume_mask'].tolist()
# save_json_data_dict['volume_vertex_index'] = data_dict['volume_vertex_index'].tolist()
# save_json_data_dict['vol_vert_FS_RAS_ind'] = data_dict['vol_vert_FS_RAS_ind'].tolist()


# with open(f"{mat_fname}.json", 'w') as f:
#     json.dump(save_json_data_dict, f)

# with open(f"{mat_fname}_test1.json", 'w') as f:
#     save_json_data_dict                        = {}
#     save_json_data_dict['params']              = data_dict['params']
#     save_json_data_dict['gen_time']            = data_dict['gen_time']
#     # save_json_data_dict['Vx']                  = data_dict['Vx'].tolist()
#     # save_json_data_dict['Vy']                  = data_dict['Vy'].tolist()
#     # save_json_data_dict['Vz']                  = data_dict['Vz'].tolist()
#     # save_json_data_dict['volume_mask']         = data_dict['volume_mask'].tolist()
#     # save_json_data_dict['volume_vertex_index'] = data_dict['volume_vertex_index'].tolist()
#     # save_json_data_dict['vol_vert_FS_RAS_ind'] = data_dict['vol_vert_FS_RAS_ind'].tolist()
#     json.dump(save_json_data_dict, f)

# with open(f"{mat_fname}_test2.json", 'w') as f:
#     save_json_data_dict                        = {}
#     save_json_data_dict['params']              = data_dict['params']
#     save_json_data_dict['gen_time']            = data_dict['gen_time']
#     save_json_data_dict['Vx']                  = data_dict['Vx'].tolist()
#     # save_json_data_dict['Vy']                  = data_dict['Vy'].tolist()
#     # save_json_data_dict['Vz']                  = data_dict['Vz'].tolist()
#     # save_json_data_dict['volume_mask']         = data_dict['volume_mask'].tolist()
#     # save_json_data_dict['volume_vertex_index'] = data_dict['volume_vertex_index'].tolist()
#     # save_json_data_dict['vol_vert_FS_RAS_ind'] = data_dict['vol_vert_FS_RAS_ind'].tolist()
#     json.dump(save_json_data_dict, f)

# with open(f"{mat_fname}_test.json", 'w') as f:
#     save_json_data_dict                        = {}
#     save_json_data_dict['params']              = data_dict['params']
#     save_json_data_dict['gen_time']            = data_dict['gen_time']
#     save_json_data_dict['Vx']                  = data_dict['Vx'].tolist()
#     save_json_data_dict['Vy']                  = data_dict['Vy'].tolist()
#     save_json_data_dict['Vz']                  = data_dict['Vz'].tolist()
#     save_json_data_dict['volume_mask']         = data_dict['volume_mask'].tolist()
#     save_json_data_dict['volume_vertex_index'] = data_dict['volume_vertex_index'].tolist()
#     save_json_data_dict['vol_vert_FS_RAS_ind'] = data_dict['vol_vert_FS_RAS_ind'].tolist()
#     json.dump(save_json_data_dict, f)

with open(f"{mat_fname}_metadata.json", 'w') as f:
    save_json_data_dict                        = {}
    save_json_data_dict['params']              = data_dict['params']
    save_json_data_dict['gen_time']            = data_dict['gen_time']
    # save_json_data_dict['Vx']                  = data_dict['Vx'].tolist()
    # save_json_data_dict['Vy']                  = data_dict['Vy'].tolist()
    # save_json_data_dict['Vz']                  = data_dict['Vz'].tolist()
    save_json_data_dict['volume_mask']         = data_dict['volume_mask'].tolist()
    save_json_data_dict['volume_vertex_index'] = data_dict['volume_vertex_index'].tolist()
    save_json_data_dict['vol_vert_FS_RAS_ind'] = data_dict['vol_vert_FS_RAS_ind'].tolist()
    json.dump(save_json_data_dict, f)

with open(f"{mat_fname}_Vx.json", 'w') as f:
    save_json_data_dict                        = {}
    save_json_data_dict['params']              = data_dict['params']
    save_json_data_dict['gen_time']            = data_dict['gen_time']
    save_json_data_dict['Vx']                  = data_dict['Vx'].tolist()
    # save_json_data_dict['Vy']                  = data_dict['Vy'].tolist()
    # save_json_data_dict['Vz']                  = data_dict['Vz'].tolist()
    # save_json_data_dict['volume_mask']         = data_dict['volume_mask'].tolist()
    # save_json_data_dict['volume_vertex_index'] = data_dict['volume_vertex_index'].tolist()
    # save_json_data_dict['vol_vert_FS_RAS_ind'] = data_dict['vol_vert_FS_RAS_ind'].tolist()
    json.dump(save_json_data_dict, f)

with open(f"{mat_fname}_Vy.json", 'w') as f:
    save_json_data_dict                        = {}
    save_json_data_dict['params']              = data_dict['params']
    save_json_data_dict['gen_time']            = data_dict['gen_time']
    # save_json_data_dict['Vx']                  = data_dict['Vx'].tolist()
    save_json_data_dict['Vy']                  = data_dict['Vy'].tolist()
    # save_json_data_dict['Vz']                  = data_dict['Vz'].tolist()
    # save_json_data_dict['volume_mask']         = data_dict['volume_mask'].tolist()
    # save_json_data_dict['volume_vertex_index'] = data_dict['volume_vertex_index'].tolist()
    # save_json_data_dict['vol_vert_FS_RAS_ind'] = data_dict['vol_vert_FS_RAS_ind'].tolist()
    json.dump(save_json_data_dict, f)

with open(f"{mat_fname}_Vz.json", 'w') as f:
    save_json_data_dict                        = {}
    save_json_data_dict['params']              = data_dict['params']
    save_json_data_dict['gen_time']            = data_dict['gen_time']
    # save_json_data_dict['Vx']                  = data_dict['Vx'].tolist()
    # save_json_data_dict['Vy']                  = data_dict['Vy'].tolist()
    save_json_data_dict['Vz']                  = data_dict['Vz'].tolist()
    # save_json_data_dict['volume_mask']         = data_dict['volume_mask'].tolist()
    # save_json_data_dict['volume_vertex_index'] = data_dict['volume_vertex_index'].tolist()
    # save_json_data_dict['vol_vert_FS_RAS_ind'] = data_dict['vol_vert_FS_RAS_ind'].tolist()
    json.dump(save_json_data_dict, f)