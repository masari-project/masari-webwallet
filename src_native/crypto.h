// Copyright (c) 2014-2018, The Monero Project
// 
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
// 
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//    of conditions and the following disclaimer in the documentation and/or other
//    materials provided with the distribution.
// 
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//    used to endorse or promote products derived from this software without specific
//    prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// 
// Parts of this file are originally copyright (c) 2012-2013 The Cryptonote developers

#pragma once

#include <cstddef>
#include <iostream>
//#include <boost/thread/mutex.hpp>
//#include <boost/thread/lock_guard.hpp>
//#include <boost/utility/value_init.hpp>
//#include <boost/optional.hpp>
#include <type_traits>
#include <vector>

#include "common/pod-class.h"
//#include "common/util.h"
//#include "memwipe.h"
#include "generic-ops.h"
//#include "hex.h"
//#include "span.h"
//#include "hash.h"

namespace crypto {

//  extern "C" {
//#include "random.h"
//  }

//  extern boost::mutex random_lock;

#pragma pack(push, 1)
    struct ec_point {
        char data[32];
    };

    struct ec_scalar {
        char data[32];
    };

    struct public_key : ec_point {
        friend class crypto_ops;
    };
/*
//  using secret_key = tools::scrubbed<ec_scalar>;

    struct public_keyV {
        std::vector <public_key> keys;
        int rows;
    };

    struct secret_keyV {
        std::vector <secret_key> keys;
        int rows;
    };

    struct public_keyM {
        int cols;
        int rows;
        std::vector <secret_keyV> column_vectors;
    };
*/
    struct key_derivation : ec_point {
        friend class crypto_ops;
    };
/*
    struct key_image : ec_point {
        friend class crypto_ops;
    };

    struct signature {
        ec_scalar c, r;

        friend class crypto_ops;
    };*/
#pragma pack(pop)

    class crypto_ops {
    public:
        crypto_ops();
        crypto_ops(const crypto_ops &);
        void operator=(const crypto_ops &);
        ~crypto_ops();

//        static secret_key generate_keys(public_key &pub, secret_key &sec, const secret_key& recovery_key = secret_key(), bool recover = false);
//        friend secret_key generate_keys(public_key &pub, secret_key &sec, const secret_key& recovery_key, bool recover);
//        static bool check_key(const public_key &);
//        friend bool check_key(const public_key &);
//        static bool secret_key_to_public_key(const secret_key &, public_key &);
//        friend bool secret_key_to_public_key(const secret_key &, public_key &);
//        static bool generate_key_derivation(const public_key &, const secret_key &, key_derivation &);
//        friend bool generate_key_derivation(const public_key &, const secret_key &, key_derivation &);
        static void derivation_to_scalar(const key_derivation &derivation, size_t output_index, ec_scalar &res);
//        friend void derivation_to_scalar(const key_derivation &derivation, size_t output_index, ec_scalar &res);
        static bool derive_public_key(const key_derivation &, std::size_t, const public_key &, public_key &);
//        friend bool derive_public_key(const key_derivation &, std::size_t, const public_key &, public_key &);
//        static void derive_secret_key(const key_derivation &, std::size_t, const secret_key &, secret_key &);
//        friend void derive_secret_key(const key_derivation &, std::size_t, const secret_key &, secret_key &);
//        static bool derive_subaddress_public_key(const public_key &, const key_derivation &, std::size_t, public_key &);
//        friend bool derive_subaddress_public_key(const public_key &, const key_derivation &, std::size_t, public_key &);
//        static void generate_signature(const hash &, const public_key &, const secret_key &, signature &);
//        friend void generate_signature(const hash &, const public_key &, const secret_key &, signature &);
//        static bool check_signature(const hash &, const public_key &, const signature &);
//        friend bool check_signature(const hash &, const public_key &, const signature &);
//        static void generate_tx_proof(const hash &, const public_key &, const public_key &, const boost::optional<public_key> &, const public_key &, const secret_key &, signature &);
//        friend void generate_tx_proof(const hash &, const public_key &, const public_key &, const boost::optional<public_key> &, const public_key &, const secret_key &, signature &);
//        static bool check_tx_proof(const hash &, const public_key &, const public_key &, const boost::optional<public_key> &, const public_key &, const signature &);
//        friend bool check_tx_proof(const hash &, const public_key &, const public_key &, const boost::optional<public_key> &, const public_key &, const signature &);
//        static void generate_key_image(const public_key &, const secret_key &, key_image &);
//        friend void generate_key_image(const public_key &, const secret_key &, key_image &);
//        static void generate_ring_signature(const hash &, const key_image &,
//                                            const public_key *const *, std::size_t, const secret_key &, std::size_t, signature *);
//        friend void generate_ring_signature(const hash &, const key_image &,
//                                            const public_key *const *, std::size_t, const secret_key &, std::size_t, signature *);
//        static bool check_ring_signature(const hash &, const key_image &,
//                                         const public_key *const *, std::size_t, const signature *);
//        friend bool check_ring_signature(const hash &, const key_image &,
//                                         const public_key *const *, std::size_t, const signature *);
    };

//    inline void derivation_to_scalar(const key_derivation &derivation, size_t output_index, ec_scalar &res) {
//        return crypto_ops::derivation_to_scalar(derivation, output_index, res);
//    }

}